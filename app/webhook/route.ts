import { provisionServer } from "@/lib/Pterodactyl/createServers/provisionServer";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import { NextRequest } from "next/server";

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
                // console.log(`PaymentIntent for`, intent, `successful`);

                // Provision Server

                break;

            case 'checkout.session.completed':
                // console.log(`Session complete: `, intent);

                const serverIntentId = parseInt(stripeIntent.metadata.serverIntend);
                console.log('ServerIntend: ', stripeIntent);

                await prisma.serverIntend.update({
                    where: {
                        id: serverIntentId,
                    },
                    data: {
                        stripeSession: stripeIntent.id
                    }
                })

                provisionServer(serverIntentId)

                break;
            default:
                console.log(`Unhandeld Webhook type: ${event.type}`)
        }
        return new Response('Success', { status: 200 });
    }
}