'use server';

import { auth } from '@/auth';
import { env } from 'next-runtime-env';
import { calculateNew, calculateUpgradeCost } from '@/lib/GlobalFunctions/paymentLogic';
import { prisma } from '@/prisma';
import { OrderType } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import { ServerConfig } from '../[locale]/booking2/[gameId]/page';
import { HardwareConfig } from '@/models/config';
import { headers } from 'next/headers';

export type CheckoutParams = {
    type: OrderType;
    creationServerConfig?: ServerConfig; // Needed for Server Creation!!!
    ptServerId: string | null;
    ramMB: number;
    cpuPercent: number;
    diskMB: number;
    duration: number;
};

export async function checkoutAction(params: CheckoutParams) {
    const { type, ptServerId, ramMB, cpuPercent, diskMB, duration, creationServerConfig } = params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error('Not authenticated');
    const user = session.user;

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
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

    switch (type) {
        case 'NEW': {
            if (!creationServerConfig) throw new Error('No Serverconfigration given');
            const location = await prisma.location.findFirstOrThrow({
                where: { id: creationServerConfig.hardwareConfig.pfGroupId },
                include: { cpu: true, ram: true },
            });

            const price = calculateNew(location, cpuPercent, ramMB, duration);

            // 1. Create the ServerOrder

            const order = await prisma.gameServerOrder.create({
                data: {
                    type,
                    gameServerId: ptServerId,
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
                            product_data: { name: `${type} Game Server` },
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
                ramMb: ramMB - oldConfig.ramMb,
                diskMb: diskMB - oldConfig.diskMb,
                durationsDays: duration,
                pfGroupId: server.locationId,
            };

            const price = calculateUpgradeCost(oldConfig, newConfig, performanceGroup);

            const order = await prisma.gameServerOrder.create({
                data: {
                    type,
                    gameServerId: server.id,
                    userId: user.id,
                    ramMB,
                    cpuPercent,
                    diskMB,
                    price: price.totalCents,
                    expiresAt: new Date(
                        Math.max(server.expires.getTime(), new Date().getTime()) +
                            duration * 24 * 60 * 60 * 1000,
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
                                name: `Upgrade Game Server to ${cpuPercent}% CPU, ${ramMB}MB RAM`,
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
                return_url: `${env('NEXT_PUBLIC_APP_URL')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`, // TODO: new return url
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
    }
}
