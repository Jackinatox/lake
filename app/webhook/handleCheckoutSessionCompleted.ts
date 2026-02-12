import { logger } from '@/lib/logger';
import { provisionServerWithWorker } from '@/lib/Pterodactyl/createServers/provisionServer';
import upgradeGameServer from '@/lib/Pterodactyl/upgradeServer/upgradeServer';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

import { Stripe } from 'stripe';
import { sendInvoiceEmail } from '@/lib/email/sendEmailEmailsFromLake';
import { env } from 'next-runtime-env';
import upgradeFromFreeGameServer from '@/lib/Pterodactyl/upgradeFromFree/upgradeFromFree';

export default async function handleCheckoutSessionCompleted(
    checkoutSession: Stripe.Checkout.Session,
) {
    try {
        const serverOrderId = checkoutSession.metadata?.orderId || '';

        const orderUnprocessed = await prisma.gameServerOrder.findUniqueOrThrow({
            where: { id: serverOrderId },
        });

        if (orderUnprocessed?.status === 'PAID') {
            logger.info('Order already processed, skipping', 'PAYMENT_LOG', {
                details: { serverOrderId: serverOrderId },
            });
            return;
        }

        const session = await stripe.checkout.sessions.retrieve(checkoutSession.id, {
            expand: ['payment_intent.latest_charge'],
        });

        let receiptUrl: string | null = null;

        if (
            typeof session.payment_intent !== 'string' &&
            session.payment_intent?.latest_charge &&
            typeof session.payment_intent.latest_charge !== 'string'
        ) {
            receiptUrl = session.payment_intent.latest_charge.receipt_url;
        }

        try {
            switch (orderUnprocessed.type) {
                case 'NEW':
                case 'PACKAGE': {
                    const jobId = await provisionServerWithWorker(orderUnprocessed);
                    await prisma.gameServerOrder.update({
                        where: { id: orderUnprocessed.id },
                        data: {
                            workerJobId: jobId,
                            status: 'PAID',
                        },
                    });
                    break;
                }
                case 'UPGRADE':
                    await upgradeGameServer(orderUnprocessed);
                    break;
                case 'TO_PAYED':
                    throw new Error('Feature not implemented yet.');
                    await upgradeFromFreeGameServer(orderUnprocessed);
                    break;
                default:
                    console.error(`Unhandled server order type: ${orderUnprocessed.type}`);
            }
        } catch (provisionError) {
            logger.error('Error during server provisioning/upgrade', 'PAYMENT_LOG', {
                details: { error: provisionError, serverOrderId: serverOrderId },
            });
            throw provisionError;
        } finally {
            // Move status update to later so the new wait/[jobId] page can get shown
            await prisma.gameServerOrder.update({
                where: {
                    id: serverOrderId,
                },
                data: {
                    stripeSessionId: checkoutSession.id,
                    status: 'PAID',
                    receipt_url: receiptUrl,
                },
            });
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
                    serverName: 'Game Server',
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
                    details: {
                        serverOrderId: updatedOrder.id,
                        userEmail: updatedOrder.user.email,
                        gameName: gameName,
                    },
                });
            } catch (emailError) {
                logger.error('Failed to send booking/invoice emails', 'EMAIL', {
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
    }
}
