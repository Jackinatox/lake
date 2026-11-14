import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

import { after, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { recordCheckoutSession, provisionCheckoutSession } from './handleCheckoutSessionCompleted';
import {
    handleRefundUpdated,
    handleChargeDisputeCreated,
    handlePaymentSucceded,
} from './handleRefundWebhooks';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const endpointSecret = process.env.webhookSecret!;
    let event: Stripe.Event;

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
        logger.error('Missing stripe-signature header', 'PAYMENT');
        throw new Error('Missing signature header');
    }

    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
        logger.info(`Webhook event`, 'PAYMENT', {
            details: { eventType: event.type, event: event },
        });
    } catch (error) {
        logger.error('Webhook signature failed: ', 'PAYMENT', {
            details: {
                error: error,
                secretType: endpointSecret.startsWith('whsec_')
                    ? 'webhook'
                    : 'probably wrong secret',
            },
        });
        return new Response('Webhook signature verification failed', {
            status: 400,
        });
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            // TODO: For Sepa this can fire up to 14 days later, handle accordingly, maybe block server
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            logger.info('PaymentIntent succeeded', 'PAYMENT', {
                details: { paymentIntent: paymentIntent },
            });
            break;

        case 'checkout.session.completed':
            const checkoutSession = event.data.object as Stripe.Checkout.Session;
            logger.info('Handling checkout.session.completed', 'PAYMENT', {
                details: { sessionId: checkoutSession.id },
            });
            // Persist Stripe IDs synchronously so invoice.payment_succeeded
            // (which can arrive before this response returns) can find the order.
            const orderIdToProvision = await recordCheckoutSession(checkoutSession);
            if (orderIdToProvision) {
                after(async () => {
                    await provisionCheckoutSession(checkoutSession, orderIdToProvision);
                });
            }
            break;

        case 'checkout.session.expired':
            const expiredSession = event.data.object as Stripe.Checkout.Session;
            const expiredOrders = await prisma.gameServerOrder.updateManyAndReturn({
                where: {
                    stripeSessionId: expiredSession.id,
                },
                data: {
                    status: 'EXPIRED',
                },
                select: { userId: true, gameServerId: true },
            });
            logger.info('Session expired', 'PAYMENT', {
                userId: expiredOrders[0]?.userId,
                gameServerId: expiredOrders[0]?.gameServerId ?? undefined,
                details: { session: expiredSession },
            });
            break;

        case 'checkout.session.async_payment_failed':
            const failedAsyncSession = event.data.object as Stripe.Checkout.Session;
            const failedAsyncOrders = await prisma.gameServerOrder.updateManyAndReturn({
                where: {
                    stripeSessionId: failedAsyncSession.id,
                },
                data: {
                    status: 'PAYMENT_FAILED',
                },
                select: { userId: true, gameServerId: true },
            });
            logger.error('Async payment failed - Admin attention required', 'PAYMENT', {
                userId: failedAsyncOrders[0]?.userId,
                gameServerId: failedAsyncOrders[0]?.gameServerId ?? undefined,
                details: {
                    sessionId: failedAsyncSession.id,
                    paymentIntentId: failedAsyncSession.payment_intent,
                },
            });
            break;

        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object as Stripe.PaymentIntent;
            // Find and update order by payment intent
            const sessions = await stripe.checkout.sessions.list({
                payment_intent: failedIntent.id as string,
                limit: 1,
            });

            const failedOrders =
                sessions.data.length > 0
                    ? await prisma.gameServerOrder.updateManyAndReturn({
                          where: {
                              stripeSessionId: sessions.data[0].id,
                          },
                          data: {
                              status: 'PAYMENT_FAILED',
                          },
                          select: { userId: true, gameServerId: true },
                      })
                    : [];

            logger.error('Payment failed', 'PAYMENT', {
                userId: failedOrders[0]?.userId,
                gameServerId: failedOrders[0]?.gameServerId ?? undefined,
                details: {
                    paymentIntentId: failedIntent.id,
                    failureCode: failedIntent.last_payment_error?.code,
                    failureMessage: failedIntent.last_payment_error?.message,
                },
            });
            break;

        // This account's API version delivers the legacy event name
        // `charge.refund.updated` (with a Refund payload) instead of the
        // newer `refund.created` / `refund.updated`. Match both schemes.
        case 'refund.created':
        case 'refund.updated':
        case 'charge.refund.updated' as Stripe.Event.Type:
            const refundEvent = event.data.object as Stripe.Refund;
            logger.info(`${event.type} webhook received`, 'PAYMENT', {
                details: { refundId: refundEvent.id, status: refundEvent.status },
            });
            await handleRefundUpdated(refundEvent);
            break;

        case 'charge.dispute.created':
            const dispute = event.data.object as Stripe.Dispute;
            logger.error('Charge dispute created - Admin attention required', 'PAYMENT', {
                details: { disputeId: dispute.id, chargeId: dispute.charge },
            });
            await handleChargeDisputeCreated(dispute);
            break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object as Stripe.Invoice;
            logger.info('Invoice payment succeeded', 'PAYMENT', {
                details: { invoiceId: invoice.id },
            });
            await handlePaymentSucceded(invoice);
            break;

        default:
            logger.error(`Unhandeld Webhook type: ${event.type}`, 'PAYMENT', {
                details: {
                    event,
                },
            });
    }
    return new Response('Success', { status: 200 });
}
