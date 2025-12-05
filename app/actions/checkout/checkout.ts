'use server';

import { auth } from '@/auth';
import { calculateNew, calculateUpgradeCost } from '@/lib/GlobalFunctions/paymentLogic';
import { provisionServer } from '@/lib/Pterodactyl/createServers/provisionServer';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { getKeyValueNumber } from '@/lib/keyValue';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { GameConfig, HardwareConfig } from '@/models/config';
import prisma from '@/lib/prisma';
import { env } from 'next-runtime-env';
import {
    notifyFreeServerCreated,
    checkFreeServerEligibility,
} from '@/lib/freeServer';
import { headers } from 'next/headers';
import { FREE_SERVERS_LOCATION_ID } from '../../GlobalConstants';
import { ServerConfig } from '../../[locale]/booking2/[gameId]/page';
import upgradeToPayed from './createOrder';

export type CheckoutParams =
    | {
        type: 'NEW';
        creationServerConfig: ServerConfig; // Needed for Server Creation!!!
    }
    | {
        type: 'UPGRADE';
        upgradeConfig: HardwareConfig;
        ptServerId: string;
    }
    | {
        type: 'TO_PAYED';
        ptServerId: string;
        hardwareConfig: HardwareConfig;
    } | {
        type: 'PACKAGE';
        gameConfig: GameConfig;
        packageId: number;
    };

export async function checkoutAction(params: CheckoutParams) {
    // Destructure inside each switch branch so TypeScript can narrow the discriminated union correctly

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error('Not authenticated');
    const user = session.user;

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    let stripeUserId = dbUser?.stripeUserId ?? null;

    if (!stripeUserId) {
        const newCustomer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: {
                userId: user.id,
            },
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { stripeUserId: newCustomer.id },
        });

        stripeUserId = newCustomer.id;
    }

    switch (params.type) {
        case 'NEW': {
            const { creationServerConfig } = params;
            if (!creationServerConfig) throw new Error('No Serverconfigration given');
            const location = await prisma.location.findFirstOrThrow({
                where: { id: creationServerConfig.hardwareConfig.pfGroupId },
                include: { cpu: true, ram: true },
            });
            const hardwareConfig = creationServerConfig.hardwareConfig;
            const cpuPercent = hardwareConfig.cpuPercent;
            const ramMB = hardwareConfig.ramMb;
            const diskMB = hardwareConfig.diskMb;
            const duration = hardwareConfig.durationsDays;

            const price = calculateNew(location, cpuPercent, ramMB, duration);

            // 1. Create the ServerOrder

            const order = await prisma.gameServerOrder.create({
                data: {
                    type: params.type,
                    gameServerId: null,
                    userId: user.id,
                    ramMB,
                    cpuPercent,
                    diskMB,
                    price: price.totalCents,
                    expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
                    status: 'PENDING',
                    creationGameDataId: creationServerConfig.gameConfig.gameId,
                    creationLocationId: creationServerConfig.hardwareConfig.pfGroupId,
                    gameConfig: creationServerConfig.gameConfig as any,
                },
            });

            // 2. Create Stripe Checkout Session
            const stripeSession = await stripe.checkout.sessions.create({
                locale: 'auto',
                mode: 'payment',
                ui_mode: 'embedded',
                invoice_creation: {
                    enabled: true,
                },
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: { name: `${params.type} Game Server` },
                            unit_amount: Math.round(price.totalCents),
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    orderId: String(order.id),
                },
                customer: stripeUserId,
                return_url: `${env('NEXT_PUBLIC_APP_URL')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,

                // success_url: `${env('NEXT_PUBLIC_APP_URL')}/success`,
                // cancel_url: `${env('NEXT_PUBLIC_APP_URL')}/cancel`
            });

            // 3. Save Stripe Session ID
            await prisma.gameServerOrder.update({
                where: { id: order.id },
                data: { stripeSessionId: stripeSession.id },
            });

            return { client_secret: stripeSession.client_secret };
        }
        case 'UPGRADE': {
            const { ptServerId, upgradeConfig } = params;
            const { cpuPercent, ramMb, diskMb, durationsDays } = upgradeConfig;

            const server = await prisma.gameServer.findFirst({
                where: { ptServerId: ptServerId, userId: user.id },
            });

            if (!server)
                throw new Error(
                    `No Server Found for upgrade. ptServerId: ${ptServerId}, userId: ${user.id}`,
                );

            const performanceGroup = await prisma.location.findUnique({
                where: { id: server.locationId },
                include: { cpu: true, ram: true },
            });

            if (!performanceGroup)
                throw new Error(
                    `No performanceGroup Found for upgrade. ptServerId: ${ptServerId}, userId: ${user.id} pfId: ${server.locationId}`,
                );

            const oldConfig: HardwareConfig = {
                cpuPercent: server.cpuPercent,
                ramMb: server.ramMB,
                diskMb: server.diskMB,
                durationsDays: Math.max(
                    0,
                    Math.round(
                        (server.expires.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                    ),
                ),
                pfGroupId: server.locationId,
            };

            const newConfig: HardwareConfig = {
                cpuPercent: cpuPercent - oldConfig.cpuPercent,
                ramMb: ramMb - oldConfig.ramMb,
                diskMb: diskMb - oldConfig.diskMb,
                durationsDays: durationsDays,
                pfGroupId: server.locationId,
            };

            const price = calculateUpgradeCost(oldConfig, newConfig, performanceGroup);

            const order = await prisma.gameServerOrder.create({
                data: {
                    type: params.type,
                    gameServerId: server.id,
                    userId: user.id,
                    ramMB: ramMb,
                    cpuPercent: cpuPercent,
                    diskMB: diskMb,
                    price: price.totalCents,
                    expiresAt: new Date(
                        Math.max(server.expires.getTime(), new Date().getTime()) +
                        durationsDays * 24 * 60 * 60 * 1000,
                    ),
                    status: 'PENDING',
                },
            });

            // 2. Create Stripe Checkout Session
            const stripeSession = await stripe.checkout.sessions.create({
                locale: 'auto',
                mode: 'payment',
                ui_mode: 'embedded',
                invoice_creation: {
                    enabled: true,
                },
                line_items: [
                    {
                        price_data: {
                            currency: 'eur',
                            product_data: {
                                name: `Upgrade Game Server to ${cpuPercent}% CPU, ${ramMb}MB RAM`,
                            },
                            unit_amount: Math.round(price.totalCents),
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    orderId: String(order.id),
                },
                customer: stripeUserId,
                return_url: `${env('NEXT_PUBLIC_APP_URL')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`, // TODO: new return url and cancel
                // success_url: `${env('NEXT_PUBLIC_APP_URL')}/success`,
                // cancel_url: `${env('NEXT_PUBLIC_APP_URL')}/cancel`
            });

            // 3. Save Stripe Session ID
            await prisma.gameServerOrder.update({
                where: { id: order.id },
                data: { stripeSessionId: stripeSession.id },
            });

            return { client_secret: stripeSession.client_secret };
        }
        case 'TO_PAYED': {
            throw new Error('Feature not implemented yet.');
            const client_secret = await upgradeToPayed(params, dbUser);
            return { client_secret: client_secret };
        }
        case 'PACKAGE': {
            const { gameConfig, packageId } = params;
        
            throw new Error('Feature not implemented yet.');
            // const order = await prisma.gameServerOrder.create({
            // data: {
            //     type: 
            // }
            // });
        }
    }
}

// Create a free GameServer
export async function checkoutFreeGameServer(gameConfig: GameConfig): Promise<string> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error('Not authenticated');
    const user = session.user;

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const freeServerStats = await getFreeTierConfigCached();
    const locationId = await getKeyValueNumber(FREE_SERVERS_LOCATION_ID);

    const userAllowed = await checkFreeServerEligibility(dbUser.id, freeServerStats.maxServers);
    if (!userAllowed) {
        throw new Error('Maximale Anzahl kostenloser Server erreicht');
    }

    const order = await prisma.gameServerOrder.create({
        data: {
            type: 'FREE_SERVER',
            userId: dbUser.id,
            ramMB: freeServerStats.ram,
            cpuPercent: freeServerStats.cpu,
            diskMB: freeServerStats.storage,
            price: 0,
            expiresAt: new Date(Date.now() + freeServerStats.duration * 24 * 60 * 60 * 1000),
            status: 'PAID',
            creationGameDataId: gameConfig.gameId,
            gameConfig: gameConfig as any,
            creationLocationId: locationId
        }
    });

    try {
        const ptId = await provisionServer(order);
        // notify via lib helper (handles its own logging/errors)
        try {
            await notifyFreeServerCreated(order.id);
        } catch (notifyErr) {
            logger.error('Failed to run free server notification helper', 'EMAIL', {
                details: { error: notifyErr, orderId: order.id },
            });
        }
        return ptId;
    } catch (error) {
        logger.error("Failed to provision free server", 'GAME_SERVER', {
            userId: dbUser.id,
            details: {
                error: error instanceof Error ? error.message : JSON.stringify(error),
                orderId: order.id
            }
        });
        throw new Error("Interner Fehler - Server konnte nicht erstellt werden");
    }
}