'use server';

import { auth } from '@/auth';
import { calculateNew, calculateUpgradeCost } from '@/lib/GlobalFunctions/paymentLogic';
import { JobId, provisionServer, provisionServerWithWorker } from '@/lib/Pterodactyl/createServers/provisionServer';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import {
    checkFreeServerEligibility,
    notifyFreeServerCreated,
} from '@/lib/freeServer';
import { getKeyValueNumber } from '@/lib/keyValue';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { GameConfig, HardwareConfig } from '@/models/config';
import { env } from 'next-runtime-env';
import { headers } from 'next/headers';
import { FREE_SERVERS_LOCATION_ID } from '../../GlobalConstants';
import { ServerConfig } from '../../[locale]/booking2/[gameId]/page';
import upgradeToPayed from './createOrder';

export type CheckoutParams =
    | {
        type: 'NEW';
        locale: 'de' | 'en';
        creationServerConfig: ServerConfig; // Needed for Server Creation!!!
    }
    | {
        type: 'UPGRADE';
        locale: 'de' | 'en';
        upgradeConfig: HardwareConfig;
        ptServerId: string;
    }
    | {
        type: 'TO_PAYED';
        locale: 'de' | 'en';
        ptServerId: string;
        hardwareConfig: HardwareConfig;
    } | {
        type: 'PACKAGE';
        locale: 'de' | 'en';
        gameConfig: GameConfig;
        packageId: number;
        durationDays: number;
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
                custom_text: {
                    terms_of_service_acceptance: {
                        message: getTermsMessage(params.locale)
                    },
                },

                // Require acceptance
                consent_collection: {
                    terms_of_service: 'required',
                },
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

            // Fetch the package with location details for pricing
            const packageData = await prisma.package.findUnique({
                where: { id: packageId, enabled: true },
                include: {
                    location: {
                        include: { cpu: true, ram: true }
                    }
                },
            });

            if (!packageData) {
                throw new Error('Package not found or not available');
            }

            // Validate gameConfig has required fields
            if (!gameConfig.gameId) {
                throw new Error('Game configuration is required');
            }

            // Use provided duration
            const durationDays = params.durationDays;

            // Calculate price based on package specs
            const price = calculateNew(
                packageData.location,
                packageData.cpuPercent,
                packageData.ramMB,
                durationDays
            );

            // Create the order
            const order = await prisma.gameServerOrder.create({
                data: {
                    type: 'PACKAGE',
                    gameServerId: null,
                    userId: user.id,
                    ramMB: packageData.ramMB,
                    cpuPercent: packageData.cpuPercent,
                    diskMB: packageData.diskMB,
                    price: price.totalCents,
                    expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
                    status: 'PENDING',
                    creationGameDataId: gameConfig.gameId,
                    creationLocationId: packageData.locationId,
                    gameConfig: gameConfig as any,
                },
            });

            // Create Stripe Checkout Session
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
                                name: `${packageData.name} - Game Server Package`,
                                description: `${packageData.cpuPercent / 100} vCPU, ${packageData.ramMB / 1024}GB RAM, ${packageData.diskMB / 1024}GB Storage`,
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
                return_url: `${env('NEXT_PUBLIC_APP_URL')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
            });

            // Save Stripe Session ID
            await prisma.gameServerOrder.update({
                where: { id: order.id },
                data: { stripeSessionId: stripeSession.id },
            });

            return { client_secret: stripeSession.client_secret };
        }
    }
}

// Create a free GameServer
export async function checkoutFreeGameServer(gameConfig: GameConfig): Promise<JobId> {
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
        const jobId = await provisionServerWithWorker(order);
        // notify via lib helper (handles its own logging/errors)
        try {
            await notifyFreeServerCreated(order.id);
        } catch (notifyErr) {
            logger.error('Failed to run free server notification helper', 'EMAIL', {
                details: {
                    error: notifyErr instanceof Error ? notifyErr.message : String(notifyErr),
                    orderId: order.id
                },
            });
        }
        return jobId;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

        logger.fatal("Failed to provision free server", 'GAME_SERVER', {
            userId: dbUser.id,
            details: {
                error: errorMessage,
                orderId: order.id
            }
        });
        throw new Error("Interner Fehler - Server konnte nicht erstellt werden");
    }
}

function getTermsMessage(locale: 'de' | 'en') {
    if (locale === 'de') {
        return 'Ich stimme Scyed\'s AGB und der Widerrufsbelehrung zu [AGB](https://scyed.com/de/legal/agb) (Rückerstattungen nur innerhalb von 2 Tagen nach dem Kauf).';
    } else {
        return 'I agree to Scyed\'s Terms of Service and Refund Policy [ToS](https://scyed.com/en/legal/agb) (Refunds only within 2 days of purchase).';
    }
}