'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { calculateWithdrawalEligibility } from '@/lib/refund/refundLogic';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { RefundServerAction, RefundType } from '@/app/client/generated/browser';

export type AdminRefundParams = {
    orderId: string;
    amountCents: number;
    type: RefundType; // WITHDRAWAL (Widerruf) or REFUND (Erstattung)
    serverAction: RefundServerAction; // What to do with the server
    reason?: string;
    internalNote?: string;
};

/**
 * Admin-initiated refund or withdrawal.
 *
 * - WITHDRAWAL (Widerruf): Uses pro-rata calculation, contract ends.
 *   Admin can trigger this on behalf of a user. Amount is auto-calculated.
 * - REFUND (Erstattung): Custom amount, admin decides server impact.
 */
export async function adminRefund(
    params: AdminRefundParams,
): Promise<{ success: boolean; message: string }> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Not authenticated');
    if (session.user.role !== 'admin') throw new Error('Unauthorized');

    const { orderId, amountCents, type, serverAction, reason, internalNote } = params;

    if (amountCents <= 0) {
        return { success: false, message: 'Amount must be greater than 0' };
    }

    const order = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: orderId },
        include: { refunds: true, user: { select: { email: true, name: true, id: true } } },
    });

    if (!order.stripePaymentIntent && !order.stripeChargeId) {
        return { success: false, message: 'No Stripe payment found for this order' };
    }

    // Calculate already refunded amount
    const alreadyRefundedCents = order.refunds
        .filter((r) => r.status === 'SUCCEEDED' || r.status === 'PENDING')
        .reduce((sum, r) => sum + r.amount, 0);

    const priceCents = Math.round(order.price);
    const remainingBalance = priceCents - alreadyRefundedCents;

    if (amountCents > remainingBalance) {
        return {
            success: false,
            message: `Amount (${(amountCents / 100).toFixed(2)} €) exceeds remaining balance (${(remainingBalance / 100).toFixed(2)} €)`,
        };
    }

    const typeLabel = type === 'WITHDRAWAL' ? 'Withdrawal (Widerruf)' : 'Refund (Erstattung)';

    try {
        // Create refund record in DB as PENDING
        const refundRecord = await prisma.refund.create({
            data: {
                orderId: order.id,
                amount: amountCents,
                reason: reason ?? (type === 'WITHDRAWAL' ? 'Admin-initiated withdrawal (Widerruf)' : 'Admin-initiated refund'),
                internalNote: internalNote ?? null,
                status: 'PENDING',
                type,
                serverAction,
                isAutomatic: false,
                initiatedBy: session.user.id,
            },
        });

        // Create the Stripe refund
        const refundParams: Stripe.RefundCreateParams = {
            amount: amountCents,
            reason: 'requested_by_customer',
            metadata: {
                order_id: order.id,
                refund_record_id: refundRecord.id,
                admin_id: session.user.id,
                refund_type: type,
                server_action: serverAction,
                internal_note: internalNote ?? '',
            },
        };

        if (order.stripePaymentIntent) {
            refundParams.payment_intent = order.stripePaymentIntent;
        } else if (order.stripeChargeId) {
            refundParams.charge = order.stripeChargeId;
        }

        const stripeRefund = await stripe.refunds.create(
            refundParams,
            {
                idempotencyKey: `admin-refund-${order.id}-${refundRecord.id}`,
            },
        );

        // Update the refund record with Stripe refund ID
        await prisma.refund.update({
            where: { id: refundRecord.id },
            data: {
                stripeRefundId: stripeRefund.id,
                status: stripeRefund.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
            },
        });

        // Calculate total refunded to determine refund status
        const totalRefunded = alreadyRefundedCents + amountCents;
        const isFullRefund = totalRefunded >= priceCents;

        // Update order refund status
        await prisma.gameServerOrder.update({
            where: { id: order.id },
            data: {
                refundStatus: isFullRefund ? 'FULL' : 'PARTIAL',
                status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            },
        });

        logger.info(`Admin ${typeLabel} created`, 'PAYMENT', {
            userId: session.user.id,
            details: {
                orderId: order.id,
                refundId: refundRecord.id,
                stripeRefundId: stripeRefund.id,
                amountCents,
                type,
                serverAction,
                isFullRefund,
                targetUser: order.user.email,
                internalNote,
            },
        });

        return {
            success: true,
            message: `${typeLabel} of ${(amountCents / 100).toFixed(2)} € has been initiated for order ${order.id}`,
        };
    } catch (error) {
        logger.error(`Failed to create admin ${typeLabel}`, 'PAYMENT', {
            userId: session.user.id,
            details: { orderId: order.id, amountCents, type, serverAction, error },
        });

        if (error instanceof stripe.errors.StripeError) {
            if (error.code === 'charge_already_refunded') {
                return { success: false, message: 'This charge has already been fully refunded' };
            }
            if (error.code === 'amount_too_large') {
                return { success: false, message: 'Refund amount exceeds the original charge' };
            }
        }

        return { success: false, message: 'An error occurred while processing the request' };
    }
}

/**
 * Calculate admin withdrawal amount using the same pro-rata logic as user self-service.
 * This is used when admin selects WITHDRAWAL type to auto-calculate the amount.
 */
export async function calculateAdminWithdrawalAmount(orderId: string): Promise<{
    refundableAmountCents: number;
    usedDays: number;
    totalDays: number;
    eligible: boolean;
    reason: string | null;
}> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Not authenticated');
    if (session.user.role !== 'admin') throw new Error('Unauthorized');

    const order = await prisma.gameServerOrder.findUniqueOrThrow({
        where: { id: orderId },
        include: { refunds: { select: { amount: true, status: true, isAutomatic: true } } },
    });

    // Use the same calculation but without the "already used self-service" check
    const result = calculateWithdrawalEligibility(order, []);
    return {
        refundableAmountCents: result.refundableAmountCents,
        usedDays: result.usedDays,
        totalDays: result.totalDays,
        eligible: result.eligible,
        reason: result.reason,
    };
}

/**
 * Get all refundable orders (for admin panel).
 */
export async function getRefundableOrders(page: number = 1, pageSize: number = 20) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Not authenticated');
    if (session.user.role !== 'admin') throw new Error('Unauthorized');

    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
        prisma.gameServerOrder.findMany({
            where: {
                status: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
                stripePaymentIntent: { not: null },
            },
            include: {
                user: { select: { id: true, email: true, name: true } },
                refunds: { orderBy: { createdAt: 'desc' } },
                gameServer: { select: { ptServerId: true, name: true, status: true } },
                creationGameData: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.gameServerOrder.count({
            where: {
                status: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
                stripePaymentIntent: { not: null },
            },
        }),
    ]);

    return { orders, total, page, pageSize };
}

/**
 * Get refund history for admin review.
 */
export async function getRefundHistory(page: number = 1, pageSize: number = 20) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Not authenticated');
    if (session.user.role !== 'admin') throw new Error('Unauthorized');

    const skip = (page - 1) * pageSize;

    const [refunds, total] = await Promise.all([
        prisma.refund.findMany({
            include: {
                order: {
                    include: {
                        user: { select: { id: true, email: true, name: true } },
                        creationGameData: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
        }),
        prisma.refund.count(),
    ]);

    return { refunds, total, page, pageSize };
}
