"use server"

import { provisionServer } from "@/lib/Pterodactyl/createServers/provisionServer";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import { NextRequest } from "next/server";
import Stripe from "stripe";

const endpointSecret = process.env.webhookSecret;

export async function POST(req: NextRequest) {
    const body = await req.text()
    let event;


    if (endpointSecret) {
        const signature = req.headers.get('stripe-signature');
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                endpointSecret
            );
            console.log(`Webhook event: ${event}`)
        }
        catch (error) {
            console.error('Webhook signature failed: ', error);
            return new Response('Webhook signature verification failed', {
                status: 400
            });
        }

        const stripeIntent = event.data.object;



        switch (event.type) {
            case 'payment_intent.succeeded':

                break;

            case 'checkout.session.completed':

                // console.log(`Session complete: `, intent);

                const serverOrderId = parseInt(stripeIntent.metadata.orderId);
                console.log('ServerOrder: ', stripeIntent);


                const session = await stripe.checkout.sessions.retrieve(
                    event.data.object.id,
                    {
                        expand: ['payment_intent.latest_charge'],
                    }
                );

                let receiptUrl: string | null = null;

                if (typeof session.payment_intent !== 'string' &&
                    session.payment_intent?.latest_charge &&
                    typeof session.payment_intent.latest_charge !== 'string') {

                    receiptUrl = session.payment_intent.latest_charge.receipt_url;
                    console.log('Receipt URL:', receiptUrl);
                }

                await prisma.gameServerOrder.update({
                    where: {
                        id: serverOrderId,
                    },
                    data: {
                        stripeSessionId: stripeIntent.id,
                        status: 'PAID',
                        receipt_url: receiptUrl
                    }
                })

                const serverOrder = await prisma.gameServerOrder.findUnique({ where: { id: serverOrderId } });
                await provisionServer(serverOrder)  // This will update the status in ServerOrder

                break;
            default:
                console.error(`Unhandeld Webhook type: ${event.type}`)
        }
        return new Response('Success', { status: 200 });
    }
}