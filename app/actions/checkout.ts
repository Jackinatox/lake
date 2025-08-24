"use server"

import { auth } from "@/auth";
import { calculateBase, calculateNew, calculateUpgradeCost } from "@/lib/globalFunctions";
import { prisma } from "@/prisma";
import { OrderType } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { ServerConfig } from "../[locale]/booking2/[gameId]/page";
import { HardwareConfig } from "@/models/config";


export type CheckoutParams = {
    type: OrderType;
    creationServerConfig?: ServerConfig;    // Needed for Server Creation!!!
    gameServerId: string;
    ramMB: number;
    cpuPercent: number;
    diskMB: number;
    duration: number;
};

export async function checkoutAction(params: CheckoutParams) {
    console.log("Called")
    const { type, gameServerId, ramMB, cpuPercent, diskMB, duration, creationServerConfig } = params;
    const userSession = await auth();
    if (!userSession?.user?.id) throw new Error("Not authenticated");


    switch (type) {
        case "NEW": {
            const location = await prisma.location.findFirst({
                where: { id: creationServerConfig.hardwareConfig.pfGroupId },
                include: { cpu: true, ram: true }
            });

            const price = calculateNew(location, cpuPercent, ramMB, duration);
            console.log(price)

            // 1. Create the ServerOrder

            const order = await prisma.gameServerOrder.create({
                data: {
                    type,
                    gameServerId,
                    userId: userSession.user.id,
                    ramMB,
                    cpuPercent,
                    diskMB,
                    price: price.totalCents,
                    expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
                    status: "PENDING",
                    creationGameDataId: creationServerConfig.gameConfig.gameId,
                    creationLocationId: creationServerConfig.hardwareConfig.pfGroupId,
                    gameConfig: JSON.stringify(creationServerConfig.gameConfig)
                }
            });

            // 2. Create Stripe Checkout Session
            const stripeSession = await stripe.checkout.sessions.create({
                mode: "payment",
                ui_mode: 'embedded',
                invoice_creation: {
                    enabled: true,
                },
                line_items: [
                    {
                        price_data: {
                            currency: "eur",
                            product_data: { name: `${type} Game Server` },
                            unit_amount: Math.round(price.totalCents)
                        },
                        quantity: 1
                    }
                ],
                metadata: {
                    orderId: String(order.id)
                },
                customer_email: userSession.user.email,
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
                // success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
                // cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`
            });

            // 3. Save Stripe Session ID
            await prisma.gameServerOrder.update({
                where: { id: order.id },
                data: { stripeSessionId: stripeSession.id }
            });

            return { client_secret: stripeSession.client_secret };
        }
        case "UPGRADE": {
            const server = await prisma.gameServer.findUnique({
                where: { id: gameServerId }
            });

            const performanceGroup = await prisma.location.findUnique({
                where: { id: server.locationId },
                include: { cpu: true, ram: true }
            });

            const oldConfig: HardwareConfig = {
                cpuPercent: server.cpuPercent,
                ramMb: server.ramMB,
                diskMb: server.diskMB,
                durationsDays: Math.round((server.expires.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                pfGroupId: server.locationId
            };

            const newConfig: HardwareConfig = {
                cpuPercent: cpuPercent - oldConfig.cpuPercent,
                ramMb: ramMB - oldConfig.ramMb,
                diskMb: diskMB - oldConfig.diskMb,
                durationsDays: duration,
                pfGroupId: server.locationId
            };

            const price = calculateUpgradeCost(oldConfig, newConfig, performanceGroup);

            const order = await prisma.gameServerOrder.create({
                data: {
                    type,
                    gameServerId,
                    userId: userSession.user.id,
                    ramMB,
                    cpuPercent,
                    diskMB,
                    price: price.totalCents,
                    expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
                    status: "PENDING",
                    creationGameDataId: creationServerConfig.gameConfig.gameId,
                    creationLocationId: creationServerConfig.hardwareConfig.pfGroupId
                }
            });

            // 2. Create Stripe Checkout Session
            const stripeSession = await stripe.checkout.sessions.create({
                mode: "payment",
                ui_mode: 'embedded',
                invoice_creation: {
                    enabled: true,
                },
                line_items: [
                    {
                        price_data: {
                            currency: "eur",
                            product_data: { name: `${type} Game Server` },
                            unit_amount: Math.round(price.totalCents)
                        },
                        quantity: 1
                    }
                ],
                metadata: {
                    orderId: String(order.id)
                },
                customer_email: userSession.user.email,
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`   // TODO: new return url
                // success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
                // cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`
            });

            // 3. Save Stripe Session ID
            await prisma.gameServerOrder.update({
                where: { id: order.id },
                data: { stripeSessionId: stripeSession.id }
            });

            return { client_secret: stripeSession.client_secret };
        }
    }
}
