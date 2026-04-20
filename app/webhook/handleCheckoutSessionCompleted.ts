import { logger } from '@/lib/logger';
import { provisionServerWithWorker } from '@/lib/Pterodactyl/createServers/provisionServer';
import upgradeGameServer from '@/lib/Pterodactyl/upgradeServer/upgradeServer';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

import { Stripe } from 'stripe';
import upgradeFromFreeGameServer from '@/lib/Pterodactyl/upgradeFromFree/upgradeFromFree';

const PROVISION_RETRIES = 2;
const RETRY_DELAY_MS = 10_000;

async function provisionWithRetry(
    order: Parameters<typeof provisionServerWithWorker>[0],
): Promise<string> {
    for (let attempt = 0; attempt <= PROVISION_RETRIES; attempt++) {
        try {
            return await provisionServerWithWorker(order);
        } catch (error) {
            if (attempt < PROVISION_RETRIES) {
                logger.warn(
                    `Worker unreachable, retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${attempt + 1}/${PROVISION_RETRIES + 1})`,
                    'PAYMENT_LOG',
                    { userId: order.userId, details: { orderId: order.id, error } },
                );
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            } else {
                throw error;
            }
        }
    }
    throw new Error('unreachable');
}

/**
 * Synchronously persist IDs from the webhook payload + mark order PAID.
 * Must run before the webhook 200 response so invoice.payment_succeeded
 * (which races with this) can find the order by stripeInvoiceId.
 *
 * Only uses data already in the webhook event — no Stripe API calls.
 * The charge id + paidAt are filled in later by provisionCheckoutSession.
 *
 * Returns the order id if provisioning should run, or null if already processed.
 */
export async function recordCheckoutSession(
    checkoutSession: Stripe.Checkout.Session,
): Promise<string | null> {
    const serverOrderId = checkoutSession.metadata?.orderId || '';

    const orderUnprocessed = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: serverOrderId },
    });

    if (orderUnprocessed.status === 'PAID') {
        logger.warn('Order already processed, skipping', 'PAYMENT_LOG', {
            userId: orderUnprocessed.userId,
            gameServerId: orderUnprocessed.gameServerId ?? undefined,
            details: { serverOrderId },
        });
        return null;
    }

    const paymentIntentId =
        typeof checkoutSession.payment_intent === 'string'
            ? checkoutSession.payment_intent
            : (checkoutSession.payment_intent?.id ?? null);

    const stripeInvoiceId =
        typeof checkoutSession.invoice === 'string'
            ? checkoutSession.invoice
            : (checkoutSession.invoice?.id ?? null);

    await prisma.gameServerOrder.update({
        where: { id: serverOrderId },
        data: {
            stripeSessionId: checkoutSession.id,
            stripePaymentIntent: paymentIntentId,
            stripeInvoiceId,
            status: 'PAID',
            paidAt: new Date(),
        },
    });

    return serverOrderId;
}

export async function provisionCheckoutSession(
    checkoutSession: Stripe.Checkout.Session,
    serverOrderId: string,
) {
    try {
        // Enrich with charge id + authoritative paidAt from Stripe (not race-critical)
        try {
            const session = await stripe.checkout.sessions.retrieve(checkoutSession.id, {
                expand: ['payment_intent.latest_charge'],
            });

            if (
                typeof session.payment_intent !== 'string' &&
                session.payment_intent?.latest_charge &&
                typeof session.payment_intent.latest_charge !== 'string'
            ) {
                await prisma.gameServerOrder.update({
                    where: { id: serverOrderId },
                    data: {
                        stripeChargeId: session.payment_intent.latest_charge.id,
                        paidAt: new Date(session.payment_intent.latest_charge.created * 1000),
                    },
                });
            }
        } catch (enrichError) {
            logger.warn('Failed to enrich order with chargeId/paidAt', 'PAYMENT_LOG', {
                details: { serverOrderId, error: enrichError },
            });
        }

        const order = await prisma.gameServerOrder.findUniqueOrThrow({
            where: { id: serverOrderId },
        });

        try {
            switch (order.type) {
                case 'NEW':
                case 'CONFIGURED':
                case 'PACKAGE': {
                    await provisionWithRetry(order);
                    await prisma.gameServerOrder.update({
                        where: { id: order.id },
                        data: { provisioningStatus: 'SUBMITTED' },
                    });
                    break;
                }
                case 'UPGRADE':
                    await upgradeGameServer(order);
                    await prisma.gameServerOrder.update({
                        where: { id: order.id },
                        data: { provisioningStatus: 'SUBMITTED' },
                    });
                    break;
                case 'TO_PAYED':
                    throw new Error('Feature not implemented yet.');
                    await upgradeFromFreeGameServer(order);
                    break;
                default:
                    logger.fatal(`Unhandled server order type: ${order.type}`, 'SYSTEM', {
                        userId: order.userId,
                        gameServerId: order.gameServerId ?? undefined,
                        details: { serverOrderId, orderType: order.type },
                    });
            }
        } catch (provisionError) {
            logger.error('Provisioning failed after all retries', 'PAYMENT_LOG', {
                userId: order.userId,
                gameServerId: order.gameServerId ?? undefined,
                details: { error: provisionError, serverOrderId, orderType: order.type },
            });
            await prisma.gameServerOrder.update({
                where: { id: order.id },
                data: {
                    provisioningStatus: 'FAILED',
                    errorText: `Provisioning failed: ${provisionError instanceof Error ? provisionError.message : 'Unknown error'}`,
                },
            });
        }
    } catch (error) {
        logger.fatal('Error provisioning checkout session', 'PAYMENT_LOG', {
            details: { error, serverOrderId },
        });
        await prisma.gameServerOrder.updateMany({
            where: { id: serverOrderId },
            data: {
                errorText: `Error processing order: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
        });
    }
}
