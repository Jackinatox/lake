'use server';

import { Logger, logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/prisma';
import { env } from 'next-runtime-env';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import handleCheckoutSessionCompleted from './handleCheckoutSessionCompleted';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const endpointSecret = env('webhookSecret')!;
    let event: Stripe.Event;

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
        throw new Error('Missing signature header');
    }

    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
        console.log(`Webhook event: ${event}`);
    } catch (error) {
        console.error('Webhook signature failed: ', error);
        return new Response('Webhook signature verification failed', {
            status: 400,
        });
    }

    logger.info('Received Stripe webhook', 'PAYMENT_LOG', { details: { eventType: event.type } });
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            logger.info('PaymentIntent succeeded', 'PAYMENT_LOG', {
                details: { paymentIntent: paymentIntent },
            });
            break;

        case 'checkout.session.completed':
            const checkoutSession = event.data.object as Stripe.Checkout.Session;
            logger.info('Handling checkout.session.completed', 'PAYMENT_LOG', {
                details: { paymentSession: checkoutSession },
            });

            await handleCheckoutSessionCompleted(checkoutSession);
            break;

        case 'checkout.session.expired':
            const expiredSession = event.data.object as Stripe.Checkout.Session;
            console.log(`Session expired: `, expiredSession);
            await prisma.gameServerOrder.updateMany({
                where: {
                    stripeSessionId: expiredSession.id,
                },
                data: {
                    status: 'EXPIRED',
                },
            });
            break;

        default:
            console.error(`Unhandeld Webhook type: ${event.type}`);
    }
    return new Response('Success', { status: 200 });
}
