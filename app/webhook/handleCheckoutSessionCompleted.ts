import { logger } from '@/lib/logger';
import { provisionServerWithWorker } from '@/lib/Pterodactyl/createServers/provisionServer';
import upgradeGameServer from '@/lib/Pterodactyl/upgradeServer/upgradeServer';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

import { Stripe } from 'stripe';
import { sendInvoiceEmail } from '@/lib/email/sendEmailEmailsFromLake';
import { env } from 'next-runtime-env';
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

export default async function handleCheckoutSessionCompleted(
    checkoutSession: Stripe.Checkout.Session,
) {
    try {
        const serverOrderId = checkoutSession.metadata?.orderId || '';

        const orderUnprocessed = await prisma.gameServerOrder.findUniqueOrThrow({
            where: { id: serverOrderId },
        });

        if (orderUnprocessed?.status === 'PAID') {
            logger.warn('Order already processed, skipping', 'PAYMENT_LOG', {
                userId: orderUnprocessed.userId,
                gameServerId: orderUnprocessed.gameServerId ?? undefined,
                details: { serverOrderId: serverOrderId },
            });
            return;
        }

        const session = await stripe.checkout.sessions.retrieve(checkoutSession.id, {
            expand: ['payment_intent.latest_charge'],
        });

        let receiptUrl: string | null = null;
        let paymentIntentId: string | null = null;
        let chargeId: string | null = null;

        if (typeof session.payment_intent !== 'string' && session.payment_intent) {
            paymentIntentId = session.payment_intent.id;

            if (
                session.payment_intent.latest_charge &&
                typeof session.payment_intent.latest_charge !== 'string'
            ) {
                receiptUrl = session.payment_intent.latest_charge.receipt_url;
                chargeId = session.payment_intent.latest_charge.id;
            }
        } else if (typeof session.payment_intent === 'string') {
            paymentIntentId = session.payment_intent;
        }

        await prisma.gameServerOrder.update({
            where: {
                id: serverOrderId,
            },
            data: {
                stripeSessionId: checkoutSession.id,
                stripePaymentIntent: paymentIntentId,
                stripeChargeId: chargeId,
                status: 'PAID',
                receipt_url: receiptUrl,
            },
        });

        try {
            switch (orderUnprocessed.type) {
                case 'NEW':
                case 'CONFIGURED':
                case 'PACKAGE': {
                    const jobId = await provisionWithRetry(orderUnprocessed);
                    await prisma.gameServerOrder.update({
                        where: { id: orderUnprocessed.id },
                        data: {
                            workerJobId: jobId,
                            provisioningStatus: 'SUBMITTED',
                        },
                    });
                    break;
                }
                case 'UPGRADE':
                    await upgradeGameServer(orderUnprocessed);
                    await prisma.gameServerOrder.update({
                        where: { id: orderUnprocessed.id },
                        data: { provisioningStatus: 'SUBMITTED' },
                    });
                    break;
                case 'TO_PAYED':
                    throw new Error('Feature not implemented yet.');
                    await upgradeFromFreeGameServer(orderUnprocessed);
                    break;
                default:
                    logger.fatal(
                        `Unhandled server order type: ${orderUnprocessed.type}`,
                        'SYSTEM',
                        {
                            userId: orderUnprocessed.userId,
                            gameServerId: orderUnprocessed.gameServerId ?? undefined,
                            details: {
                                serverOrderId: serverOrderId,
                                orderType: orderUnprocessed.type,
                            },
                        },
                    );
            }
        } catch (provisionError) {
            logger.error('Provisioning failed after all retries', 'PAYMENT_LOG', {
                userId: orderUnprocessed.userId,
                gameServerId: orderUnprocessed.gameServerId ?? undefined,
                details: {
                    error: provisionError,
                    serverOrderId: serverOrderId,
                    orderType: orderUnprocessed.type,
                },
            });
            await prisma.gameServerOrder.update({
                where: { id: orderUnprocessed.id },
                data: {
                    provisioningStatus: 'FAILED',
                    errorText: `Provisioning failed: ${provisionError instanceof Error ? provisionError.message : 'Unknown error'}`,
                },
            });
            return;
        }

        // Fetch updated order with all relations after provisioning
        const updatedOrder = await prisma.gameServerOrder.findUniqueOrThrow({
            where: { id: serverOrderId },
            include: {
                user: true,
                creationGameData: true,
                creationLocation: true,
            },
        });

        // Send emails only if we have the necessary data
        if (updatedOrder.creationGameData && updatedOrder.creationLocation) {
            const appUrl = env('NEXT_PUBLIC_APP_URL');
            const gameName = updatedOrder.creationGameData.name;
            const gameImageUrl = `${appUrl}/images/light/games/icons/${gameName.toLowerCase()}.webp`;

            try {
                // Send invoice email
                await sendInvoiceEmail({
                    userName: updatedOrder.user.name || 'Spieler',
                    userEmail: updatedOrder.user.email,
                    invoiceNumber: `INV-${updatedOrder.id.toString().padStart(8, '0')}`,
                    invoiceDate: new Date(),
                    gameName: gameName,
                    gameImageUrl: gameImageUrl,
                    serverName: 'Gameserver',
                    orderType: updatedOrder.type,
                    ramMB: updatedOrder.ramMB,
                    cpuPercent: updatedOrder.cpuPercent,
                    diskMB: updatedOrder.diskMB,
                    location: updatedOrder.creationLocation.name || 'Unknown',
                    price: updatedOrder.price,
                    expiresAt: updatedOrder.expiresAt,
                    receiptUrl: receiptUrl || '',
                });

                logger.info('Sent booking confirmation and invoice emails', 'EMAIL', {
                    userId: updatedOrder.userId,
                    gameServerId: updatedOrder.gameServerId ?? undefined,
                    details: {
                        serverOrderId: updatedOrder.id,
                        userEmail: updatedOrder.user.email,
                        gameName: gameName,
                    },
                });
            } catch (emailError) {
                logger.error('Failed to send booking/invoice emails', 'EMAIL', {
                    userId: updatedOrder.userId,
                    gameServerId: updatedOrder.gameServerId ?? undefined,
                    details: {
                        error: emailError,
                        serverOrderId: updatedOrder.id,
                        userEmail: updatedOrder.user.email,
                    },
                });
            }
        }
    } catch (error) {
        logger.fatal('Error handling checkout.session.completed', 'PAYMENT_LOG', {
            details: { error, checkoutSessionId: checkoutSession.id },
        });
        await prisma.gameServerOrder.updateMany({
            where: {
                stripeSessionId: checkoutSession.id,
            },
            data: {
                errorText: `Error processing order: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
        });
    }
}
