import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { sendRefundEmail, sendWithdrawalEmail } from '@/lib/email/sendEmailEmailsFromLake';
import { undoRefundedOrder } from '@/lib/refund/undoRefundedOrder';
import Stripe from 'stripe';

/**
 * Handle charge.refunded webhook.
 * This fires when any refund (full or partial) is created on a charge.
 * We use this as a fallback — the primary state machine is driven by refund.updated.
 */
export async function handleChargeRefunded(charge: Stripe.Charge) {
    try {
        const order = await prisma.gameServerOrder.findFirst({
            where: { stripeChargeId: charge.id },
            include: { refunds: true },
        });

        if (!order) {
            logger.warn('charge.refunded: No order found for charge', 'PAYMENT_LOG', {
                details: { chargeId: charge.id },
            });
            return;
        }

        // Calculate total refunded from Stripe charge object (source of truth)
        const totalRefundedCents = charge.amount_refunded;
        const priceCents = Math.round(order.price);
        const isFullRefund = totalRefundedCents >= priceCents;

        await prisma.gameServerOrder.update({
            where: { id: order.id },
            data: {
                refundStatus: isFullRefund ? 'FULL' : 'PARTIAL',
                status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            },
        });

        logger.info('charge.refunded processed', 'PAYMENT_LOG', {
            details: {
                orderId: order.id,
                chargeId: charge.id,
                totalRefundedCents,
                isFullRefund,
            },
        });
    } catch (error) {
        logger.error('Error handling charge.refunded', 'PAYMENT_LOG', {
            details: { chargeId: charge.id, error },
        });
    }
}

/**
 * Handle refund.updated and refund.failed webhooks.
 * This is the primary handler for updating refund state in the DB.
 * Never trust the API response — only update from this webhook.
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

        await prisma.refund.update({
            where: { id: refundRecord.id },
            data: { status: newStatus },
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
                details: {
                    refundRecordId: refundRecord.id,
                    stripeRefundId: refund.id,
                    failureReason: refund.failure_reason,
                    orderId: refundRecord.orderId,
                },
            });
        }

        // If refund succeeded, execute server action (suspend/revert/nothing)
        // and send a confirmation email to the user
        if (newStatus === 'SUCCEEDED') {
            try {
                await undoRefundedOrder(refundRecord.orderId, refundRecord.serverAction);
            } catch (undoError) {
                logger.error('Failed to undo refunded order', 'PAYMENT_LOG', {
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
