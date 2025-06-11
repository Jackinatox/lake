import { stripe } from "@/lib/stripe";
import { NextRequest } from "next/server";

const endpointSecret = process.env.webhookSecret;

export async function POST(req: NextRequest) {
    const body = await req.text()
    let event;

    console.log(`Webhook event: ${event}`)

    if (endpointSecret) {
        const signature = req.headers.get('stripe-signature');
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                endpointSecret
            );
        }
        catch (error) {
            console.error('Webhook signature failed: ', error);
            return new Response('Webhook signature verification failed', {
                status: 400
            });
        }

        switch (event.type) {
            case 'payment_intent.succeeded':
                const intent = event.data.object;
                console.log(`PaymentIntent for ${intent} successfull`);

                // Provision Server

                break;
            default:
                console.log(`Unhandeld Webhoo type: ${event.type}`)
        }
        return new Response('Success', { status: 200 });
    }
}