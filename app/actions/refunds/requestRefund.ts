'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { calculateWithdrawalEligibility } from '@/lib/refund/refundLogic';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { headers } from 'next/headers';

export type WithdrawalEligibilityResult = {
    eligible: boolean;
    refundableAmountCents: number;
    usedDays: number;
    totalDays: number;
    reason: string | null;
    orderId: string;
    hasUpgradeOrders: boolean;
};

/**
 * Check if the current user is eligible for a withdrawal (Widerruf) on a specific order.
 */
export async function checkWithdrawalEligibility(orderId: string): Promise<WithdrawalEligibilityResult> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Not authenticated');

    const order = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: orderId, userId: session.user.id },
        include: { refunds: { select: { amount: true, status: true, isAutomatic: true } } },
    });

    // Check if there are subsequent orders (e.g. upgrades) on the same game server.
    // If the user bought a server and then upgraded it, we can't refund the original
    // order because suspending the server would also void the upgrade they paid for.
    let hasUpgradeOrders = false;
    if (order.gameServerId) {
        const subsequentOrders = await prisma.gameServerOrder.count({
            where: {
                gameServerId: order.gameServerId,
                id: { not: orderId },
                status: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
                createdAt: { gt: order.createdAt },
            },
        });
        hasUpgradeOrders = subsequentOrders > 0;
    }

    const result = calculateWithdrawalEligibility(order, order.refunds);
    return { ...result, orderId, hasUpgradeOrders };
}

/**
 * User self-service withdrawal request (Widerruf).
 * Creates a Stripe refund for the pro-rata unused amount.
 * The contract ends immediately upon withdrawal.
 */
export async function requestUserWithdrawal(
    orderId: string,
): Promise<{ success: boolean; message: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Not authenticated');

    const order = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: orderId, userId: session.user.id },
        include: { refunds: { select: { amount: true, status: true, isAutomatic: true } } },
    });

    // Validate withdrawal eligibility
    const eligibility = calculateWithdrawalEligibility(order, order.refunds);
    if (!eligibility.eligible) {
        return { success: false, message: eligibility.reason ?? 'Not eligible for withdrawal' };
    }

    if (!order.stripePaymentIntent && !order.stripeChargeId) {
        return { success: false, message: 'No Stripe payment found for this order' };
    }

    try {
        // Create refund record in DB as PENDING first
        // User self-service is always a WITHDRAWAL (Widerruf) — contract ends
        // For upgrade/renew orders, revert to previous state instead of suspending
        const withdrawalServerAction =
            order.type === 'UPGRADE' || order.type === 'RENEW' ? 'SHORTEN' : 'SUSPEND';

        const refundRecord = await prisma.refund.create({
            data: {
                orderId: order.id,
                amount: eligibility.refundableAmountCents,
                reason: 'Widerruf innerhalb der 14-Tage-Frist / Withdrawal within 14-day window',
                status: 'PENDING',
                type: 'WITHDRAWAL',
                serverAction: withdrawalServerAction,
                isAutomatic: true,
                initiatedBy: null,
            },
        });

        // Create the Stripe refund with idempotency key
        const refundParams: Stripe.RefundCreateParams = {
            amount: eligibility.refundableAmountCents,
            reason: 'requested_by_customer',
            metadata: {
                order_id: order.id,
                refund_record_id: refundRecord.id,
                user_id: session.user.id,
            },
        };

        if (order.stripePaymentIntent) {
            refundParams.payment_intent = order.stripePaymentIntent;
        } else if (order.stripeChargeId) {
            refundParams.charge = order.stripeChargeId;
        }

        const stripeRefund = await stripe.refunds.create(refundParams, {
            idempotencyKey: `refund-${order.id}-${refundRecord.id}`,
        });

        // Update the refund record with Stripe refund ID
        await prisma.refund.update({
            where: { id: refundRecord.id },
            data: {
                stripeRefundId: stripeRefund.id,
                status: stripeRefund.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
            },
        });

        // Calculate total refunded to determine refund status
        const totalRefunded =
            order.refunds
                .filter((r) => r.status === 'SUCCEEDED' || r.status === 'PENDING')
                .reduce((sum, r) => sum + r.amount, 0) + eligibility.refundableAmountCents;

        const priceCents = Math.round(order.price);
        const isFullRefund = totalRefunded >= priceCents;

        // Update order refund status
        await prisma.gameServerOrder.update({
            where: { id: order.id },
            data: {
                refundStatus: isFullRefund ? 'FULL' : 'PARTIAL',
                status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            },
        });

        logger.info('User withdrawal (Widerruf) created', 'PAYMENT', {
            userId: session.user.id,
            details: {
                orderId: order.id,
                refundId: refundRecord.id,
                stripeRefundId: stripeRefund.id,
                amountCents: eligibility.refundableAmountCents,
                isFullRefund,
                type: 'WITHDRAWAL',
            },
        });

        return {
            success: true,
            message: `Withdrawal of ${(eligibility.refundableAmountCents / 100).toFixed(2)} € has been initiated`,
        };
    } catch (error) {
        logger.error('Failed to create user withdrawal', 'PAYMENT', {
            userId: session.user.id,
            details: { orderId: order.id, error },
        });

        // Handle Stripe-specific errors
        if (error instanceof stripe.errors.StripeError) {
            if (error.code === 'charge_already_refunded') {
                return { success: false, message: 'This charge has already been fully refunded' };
            }
            if (error.code === 'amount_too_large') {
                return { success: false, message: 'Refund amount exceeds the original charge' };
            }
        }

        return { success: false, message: 'An error occurred while processing the refund' };
    }
}
