"use server"

import { auth } from "@/auth";
import { calculateTotal } from "@/lib/globalFunctions";
import { prisma } from "@/prisma";
import { OrderType } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { ServerConfig } from "../[locale]/booking2/[gameId]/page";


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
    const userId = await auth();
    if (!userId?.user?.id) throw new Error("Not authenticated");

    const price = calculateTotal(type, null, cpuPercent, ramMB, duration).total;

    // 1. Create the ServerOrder

    //TODO:  check if with the setting of the user id the user will be linked
    const order = await prisma.gameServerOrder.create({
        data: {
            type,
            gameServerId,
            userId: userId.user.id,
            ramMB,
            cpuPercent,
            diskMB,
            price: price,
            expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
            status: "PENDING",
            creationGameDataId: creationServerConfig.gameConfig.gameId,
            creationLocationId: creationServerConfig.hardwareConfig.pfGroupId,
            gameConfig: JSON.stringify(creationServerConfig.gameConfig)
        }
    });

    // 2. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
            {
                price_data: {
                    currency: "eur",
                    product_data: { name: `${type} Game Server` },
                    unit_amount: Math.round(price)
                },
                quantity: 1
            }
        ],
        metadata: {
            orderId: String(order.id)
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
        // success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
        // cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`
    });

    // 3. Save Stripe Session ID
    await prisma.gameServerOrder.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id }
    });

    return { client_secret: session.client_secret };
    return { client_secret: "StinkyBozo" }
}
