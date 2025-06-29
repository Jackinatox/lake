"use server"

import { ServerConfig } from "./page";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";

export async function createPaymentSession(orderId: string): Promise<string> {
    const origin = (await headers()).get('origin')
    const userSesh = await auth();

    if (!userSesh.user)
        return '';

    const order = await prisma.serverOrder.findUnique({
        where: {
            id: parseInt(orderId)
        }
    })

    const session = await stripe.checkout.sessions.create({
        line_items: [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: `Custom GameServer ${(order.cpuPercent / 100).toFixed(1) } Threads ${(order.ramMB / 1024).toFixed(1) } GB`,
                },
                unit_amount: Math.round(order.price * 100),
            },
            quantity: 1,
        }],
        metadata: {
            serverOrderId: order.id,
            user: userSesh.user.id
        },
        customer_email: userSesh.user.email,
        mode: 'payment',
        ui_mode: 'embedded',
        return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
    });

    return session.client_secret;

}

