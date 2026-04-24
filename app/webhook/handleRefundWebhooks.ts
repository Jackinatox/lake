import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import {
    sendInvoiceEmail,
    sendRefundEmail,
    sendWithdrawalEmail,
} from '@/lib/email/sendEmailEmailsFromLake';
import { undoRefundedOrder } from '@/lib/refund/undoRefundedOrder';
import { env } from 'next-runtime-env';
import Stripe from 'stripe';

/**
 * Handle refund.created and refund.updated webhooks.
 * This is the primary handler for updating refund state in the DB.
 * Never trust the API response — only update from this webhook.
 *
 * Both events route here because card refunds often arrive already SUCCEEDED
 * on refund.created and never fire refund.updated (no status transition).
 * The undo + email side effects are gated on a real status transition
 * (prev !== SUCCEEDED → SUCCEEDED) so replays are idempotent.
 */
export async function handleRefundUpdated(refund: Stripe.Refund) {
    try {
        const refundRecord = await prisma.refund.findUnique({
            where: { stripeRefundId: refund.id },
            include: { order: { include: { refunds: true } } },
        });

        if (!refundRecord) {
            // This could be a refund created outside our system (e.g. directly on Stripe dashboard)
            // Try to find the order by payment_intent or charge
            logger.warn(
                'refund.updated: No refund record found, attempting to reconcile',
                'PAYMENT_LOG',
                {
                    details: { stripeRefundId: refund.id },
                },
            );
            await reconcileExternalRefund(refund);
            return;
        }

        // Map Stripe status to our enum
        const statusMap: Record<string, 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'> = {
            pending: 'PENDING',
            succeeded: 'SUCCEEDED',
            failed: 'FAILED',
            canceled: 'CANCELED',
        };

        const newStatus = statusMap[refund.status ?? ''] ?? 'PENDING';
        const prevStatus = refundRecord.status;
        const transitionedToSucceeded =
            prevStatus !== 'SUCCEEDED' && newStatus === 'SUCCEEDED';

        await prisma.refund.update({
            where: { id: refundRecord.id },
            data: {
                status: newStatus,
                receiptNumber: refund.receipt_number ?? undefined,
            },
        });

        // Recalculate order refund status based on all refunds
        const allRefunds = await prisma.refund.findMany({
            where: { orderId: refundRecord.orderId },
        });

        const totalSucceeded = allRefunds
            .filter((r) => r.status === 'SUCCEEDED')
            .reduce((sum, r) => sum + r.amount, 0);

        const totalPending = allRefunds
            .filter((r) => r.status === 'PENDING')
            .reduce((sum, r) => sum + r.amount, 0);

        const priceCents = Math.round(refundRecord.order.price);

        let orderRefundStatus: 'NONE' | 'PARTIAL' | 'FULL' = 'NONE';
        let orderStatus: 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' = 'PAID';

        if (totalSucceeded >= priceCents) {
            orderRefundStatus = 'FULL';
            orderStatus = 'REFUNDED';
        } else if (totalSucceeded > 0 || totalPending > 0) {
            orderRefundStatus = 'PARTIAL';
            orderStatus = 'PARTIALLY_REFUNDED';
        }

        await prisma.gameServerOrder.update({
            where: { id: refundRecord.orderId },
            data: {
                refundStatus: orderRefundStatus,
                status: orderStatus,
            },
        });

        logger.info('refund.updated processed', 'PAYMENT_LOG', {
            userId: refundRecord.order.userId,
            gameServerId: refundRecord.order.gameServerId ?? undefined,
            details: {
                refundRecordId: refundRecord.id,
                stripeRefundId: refund.id,
                newStatus,
                totalSucceeded,
                orderRefundStatus,
            },
        });

        // If refund failed, alert via logging
        if (newStatus === 'FAILED') {
            logger.error('Refund FAILED - manual intervention required', 'PAYMENT_LOG', {
                userId: refundRecord.order.userId,
                gameServerId: refundRecord.order.gameServerId ?? undefined,
                details: {
                    refundRecordId: refundRecord.id,
                    stripeRefundId: refund.id,
                    failureReason: refund.failure_reason,
                    orderId: refundRecord.orderId,
                },
            });
        }

        // Only run undo + email on the transition into SUCCEEDED so repeated
        // webhooks (refund.created + refund.updated, or retries) don't re-suspend
        // the server or re-send the email.
        if (transitionedToSucceeded) {
            try {
                await undoRefundedOrder(refundRecord.orderId, refundRecord.serverAction);
            } catch (undoError) {
                logger.error('Failed to undo refunded order', 'PAYMENT_LOG', {
                    userId: refundRecord.order.userId,
                    gameServerId: refundRecord.order.gameServerId ?? undefined,
                    details: {
                        orderId: refundRecord.orderId,
                        refundId: refundRecord.id,
                        serverAction: refundRecord.serverAction,
                        error: undoError,
                    },
                });
            }

            // Send appropriate email based on refund type (WITHDRAWAL vs REFUND)
            try {
                const orderWithDetails = await prisma.gameServerOrder.findUniqueOrThrow({
                    where: { id: refundRecord.orderId },
                    include: {
                        user: { select: { email: true, name: true } },
                        creationGameData: { select: { name: true } },
                        refunds: { where: { status: 'SUCCEEDED' } },
                    },
                });

                const totalRefundedCents = orderWithDetails.refunds.reduce(
                    (sum, r) => sum + r.amount,
                    0,
                );
                const priceCents = Math.round(orderWithDetails.price);

                if (refundRecord.type === 'WITHDRAWAL') {
                    // Withdrawal (Widerruf) — contract ends, legally required confirmation
                    await sendWithdrawalEmail({
                        userName: orderWithDetails.user.name ?? 'Kunde',
                        userEmail: orderWithDetails.user.email,
                        orderId: refundRecord.orderId,
                        orderType: orderWithDetails.type,
                        gameName: orderWithDetails.creationGameData.name,
                        refundAmountCents: refundRecord.amount,
                        originalAmountCents: priceCents,
                        totalRefundedCents,
                        isFullRefund: totalRefundedCents >= priceCents,
                        withdrawalDate: new Date(),
                    });
                } else {
                    // Goodwill refund (Erstattung) — standard confirmation
                    await sendRefundEmail({
                        userName: orderWithDetails.user.name ?? 'Kunde',
                        userEmail: orderWithDetails.user.email,
                        orderId: refundRecord.orderId,
                        orderType: orderWithDetails.type,
                        gameName: orderWithDetails.creationGameData.name,
                        refundAmountCents: refundRecord.amount,
                        originalAmountCents: priceCents,
                        totalRefundedCents,
                        isFullRefund: totalRefundedCents >= priceCents,
                        refundDate: new Date(),
                        reason: refundRecord.reason ?? undefined,
                        serverAction: refundRecord.serverAction,
                    });
                }
            } catch (emailError) {
                logger.error('Failed to send refund/withdrawal confirmation email', 'PAYMENT_LOG', {
                    userId: refundRecord.order.userId,
                    gameServerId: refundRecord.order.gameServerId ?? undefined,
                    details: {
                        orderId: refundRecord.orderId,
                        refundId: refundRecord.id,
                        refundType: refundRecord.type,
                        error: emailError,
                    },
                });
            }
        }
    } catch (error) {
        logger.error('Error handling refund.updated', 'PAYMENT_LOG', {
            details: { stripeRefundId: refund.id, error },
        });
    }
}

/**
 * Handle charge.dispute.created webhook.
 * A dispute means the customer opened a chargeback — you cannot refund a disputed charge.
 */
export async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
    try {
        const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id;

        const order = await prisma.gameServerOrder.findFirst({
            where: { stripeChargeId: chargeId },
            include: { user: { select: { email: true, name: true } } },
        });

        if (!order) {
            logger.warn('charge.dispute.created: No order found for charge', 'PAYMENT_LOG', {
                details: { chargeId, disputeId: dispute.id },
            });
            return;
        }

        logger.error('DISPUTE OPENED - Immediate admin attention required', 'PAYMENT_LOG', {
            userId: order.userId,
            gameServerId: order.gameServerId ?? undefined,
            details: {
                orderId: order.id,
                disputeId: dispute.id,
                chargeId,
                amount: dispute.amount,
                reason: dispute.reason,
                userEmail: order.user.email,
                userName: order.user.name,
            },
        });
    } catch (error) {
        logger.error('Error handling charge.dispute.created', 'PAYMENT_LOG', {
            details: { disputeId: dispute.id, error },
        });
    }
}

/**
 * Reconcile a refund that was created outside our system (e.g. via Stripe Dashboard).
 * Creates a Refund record in our DB to keep state in sync.
 */
async function reconcileExternalRefund(refund: Stripe.Refund) {
    try {
        const paymentIntentId =
            typeof refund.payment_intent === 'string'
                ? refund.payment_intent
                : refund.payment_intent?.id;
        const chargeId = typeof refund.charge === 'string' ? refund.charge : refund.charge?.id;

        let order = null;

        if (paymentIntentId) {
            order = await prisma.gameServerOrder.findFirst({
                where: { stripePaymentIntent: paymentIntentId },
            });
        }

        if (!order && chargeId) {
            order = await prisma.gameServerOrder.findFirst({
                where: { stripeChargeId: chargeId },
            });
        }

        if (!order) {
            logger.warn('reconcileExternalRefund: Could not find matching order', 'PAYMENT_LOG', {
                details: { stripeRefundId: refund.id, paymentIntentId, chargeId },
            });
            return;
        }

        const statusMap: Record<string, 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED'> = {
            pending: 'PENDING',
            succeeded: 'SUCCEEDED',
            failed: 'FAILED',
            canceled: 'CANCELED',
        };

        // Create the missing refund record
        // External refunds default to REFUND type with NONE server action
        // since we don't know the admin's intent
        await prisma.refund.create({
            data: {
                orderId: order.id,
                stripeRefundId: refund.id,
                receiptNumber: refund.receipt_number ?? null,
                amount: refund.amount,
                reason: 'Externally created refund (Stripe Dashboard)',
                internalNote: 'Auto-reconciled from webhook',
                status: statusMap[refund.status ?? ''] ?? 'PENDING',
                type: 'REFUND',
                serverAction: 'NONE',
                isAutomatic: false,
                initiatedBy: null,
            },
        });

        // Update order status
        const allRefunds = await prisma.refund.findMany({
            where: { orderId: order.id },
        });

        const totalRefunded = allRefunds
            .filter((r) => r.status === 'SUCCEEDED' || r.status === 'PENDING')
            .reduce((sum, r) => sum + r.amount, 0);

        const priceCents = Math.round(order.price);
        const isFullRefund = totalRefunded >= priceCents;

        await prisma.gameServerOrder.update({
            where: { id: order.id },
            data: {
                refundStatus: isFullRefund ? 'FULL' : 'PARTIAL',
                status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            },
        });

        logger.info('External refund reconciled', 'PAYMENT_LOG', {
            userId: order.userId,
            gameServerId: order.gameServerId ?? undefined,
            details: {
                orderId: order.id,
                stripeRefundId: refund.id,
                amount: refund.amount,
            },
        });
    } catch (error) {
        logger.error('Error reconciling external refund', 'PAYMENT_LOG', {
            details: { stripeRefundId: refund.id, error },
        });
    }
}

export async function handlePaymentSucceded(invoice: Stripe.Invoice) {
    try {
        if (!invoice.invoice_pdf) {
            logger.error('invoice.payment_succeeded: no PDF yet, skipping', 'PAYMENT_LOG', {
                details: { invoiceId: invoice.id },
            });
            return;
        }

        // checkout.session.completed and invoice.payment_succeeded are delivered
        // in parallel by Stripe. Retry briefly in case the checkout handler
        // hasn't persisted stripeInvoiceId yet.
        const findOrder = () =>
            prisma.gameServerOrder.findFirst({
                where: { stripeInvoiceId: invoice.id },
                include: {
                    user: { select: { email: true, name: true } },
                    creationGameData: { select: { name: true } },
                    creationLocation: { select: { name: true } },
                },
            });

        const LOOKUP_RETRIES = 5;
        const LOOKUP_DELAY_MS = 1000;
        let order = await findOrder();
        for (let attempt = 1; attempt < LOOKUP_RETRIES && !order; attempt++) {
            await new Promise((r) => setTimeout(r, LOOKUP_DELAY_MS));
            order = await findOrder();
        }

        if (!order) {
            logger.error(
                'invoice.payment_succeeded: No order found for invoice after retries',
                'PAYMENT_LOG',
                { details: { invoiceId: invoice.id, retries: LOOKUP_RETRIES } },
            );
            return;
        }

        const latest = await prisma.gameServerOrder.update({
            where: { id: order.id },
            data: {
                invoicePdfUrl: invoice.invoice_pdf,
                stripeInvoiceNumber: invoice.number ?? undefined,
            },
        });

        logger.info('invoice.payment_succeeded: invoicePdfUrl saved', 'PAYMENT_LOG', {
            userId: order.userId,
            gameServerId: order.gameServerId ?? undefined,
            details: { orderId: order.id, invoiceId: invoice.id },
        });

        try {
            const gameName = order.creationGameData.name;
            await sendInvoiceEmail({
                userName: order.user.name || 'Spieler',
                userEmail: order.user.email,
                stripeInvoiceId: `${latest.stripeInvoiceNumber || "Stripe invoice war null"}`,
                invoiceDate: latest.paidAt ?? new Date(),
                gameName,
                gameImageUrl: `${env('NEXT_PUBLIC_APP_URL')}/images/light/games/icons/${gameName.toLowerCase()}.webp`,
                serverName: 'Gameserver',
                orderType: order.type,
                ramMB: order.ramMB,
                cpuPercent: order.cpuPercent,
                diskMB: order.diskMB,
                location: order.creationLocation.name || 'Unknown',
                price: order.price,
                expiresAt: order.expiresAt,
                invoicePdfUrl: invoice.invoice_pdf,
            });
        } catch (emailError) {
            logger.error('Failed to send invoice email', 'EMAIL', {
                userId: order.userId,
                gameServerId: order.gameServerId ?? undefined,
                details: { orderId: order.id, invoiceId: invoice.id, error: emailError },
            });
        }
    } catch (error) {
        logger.error('Error handling invoice.payment_succeeded', 'PAYMENT_LOG', {
            details: { invoiceId: invoice.id, error },
        });
    }
}
