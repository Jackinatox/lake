import { GameServerOrder, Refund } from '@/app/client/generated/browser';

/**
 * The maximum number of days after purchase that a user can request a self-service refund.
 * EU consumer protection: 14-day withdrawal period.
 */
export const REFUND_WINDOW_DAYS = 14;

/**
 * Calculate the pro-rata refund amount for a user self-service refund.
 *
 * The user can get refunded for the % of time they *didn't* use.
 * E.g. ordered 30 days, used 5 days → refund = (25/30) * price
 *
 * Users can only request ONE self-service refund per order.
 * For additional refunds, an admin must process them manually.
 *
 * @param order - The GameServerOrder
 * @param existingRefunds - Already-processed refunds on this order
 * @returns { eligible, refundableAmountCents, usedDays, totalDays, reason }
 */
export function calculateUserRefundEligibility(
    order: Pick<
        GameServerOrder,
        'price' | 'createdAt' | 'expiresAt' | 'status' | 'type' | 'refundStatus'
    >,
    existingRefunds: Pick<Refund, 'amount' | 'status' | 'isAutomatic'>[],
) {
    const now = new Date();
    const createdAt = new Date(order.createdAt);
    const expiresAt = new Date(order.expiresAt);

    // Only PAID orders (not already fully refunded) are eligible
    if (order.status !== 'PAID' && order.status !== 'PARTIALLY_REFUNDED') {
        return {
            eligible: false,
            refundableAmountCents: 0,
            usedDays: 0,
            totalDays: 0,
            reason: 'Order is not in a refundable state',
        };
    }

    if (order.refundStatus === 'FULL') {
        return {
            eligible: false,
            refundableAmountCents: 0,
            usedDays: 0,
            totalDays: 0,
            reason: 'Order has already been fully refunded',
        };
    }

    // Users can only request ONE self-service refund per order.
    // For additional refunds, an admin must process them via the admin panel.
    const hasExistingUserRefund = existingRefunds.some(
        (r) => r.isAutomatic && (r.status === 'SUCCEEDED' || r.status === 'PENDING'),
    );
    if (hasExistingUserRefund) {
        return {
            eligible: false,
            refundableAmountCents: 0,
            usedDays: 0,
            totalDays: 0,
            reason: 'You have already used your self-service refund for this order. Please contact support for further refunds.',
        };
    }

    // Free servers are not refundable
    if (order.type === 'FREE_SERVER') {
        return {
            eligible: false,
            refundableAmountCents: 0,
            usedDays: 0,
            totalDays: 0,
            reason: 'Free server orders are not refundable',
        };
    }

    // Check if within the 14-day refund window
    const daysSincePurchase = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSincePurchase > REFUND_WINDOW_DAYS) {
        return {
            eligible: false,
            refundableAmountCents: 0,
            usedDays: daysSincePurchase,
            totalDays: 0,
            reason: `Refund window of ${REFUND_WINDOW_DAYS} days has expired`,
        };
    }

    // Calculate total subscription period and used time
    const totalMs = expiresAt.getTime() - createdAt.getTime();
    const usedMs = Math.max(0, now.getTime() - createdAt.getTime());
    const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
    const usedDays = Math.ceil(usedMs / (1000 * 60 * 60 * 24));

    // Price is stored in cents
    const priceCents = Math.round(order.price);

    // Already refunded amount
    const alreadyRefundedCents = existingRefunds
        .filter((r) => r.status === 'SUCCEEDED' || r.status === 'PENDING')
        .reduce((sum, r) => sum + r.amount, 0);

    // Remaining chargeable balance
    const remainingBalance = priceCents - alreadyRefundedCents;

    // Pro-rata: refund unused portion
    const unusedFraction = Math.max(0, (totalDays - usedDays) / totalDays);
    const proRataRefund = Math.floor(priceCents * unusedFraction);
    const refundableAmountCents = Math.min(proRataRefund, remainingBalance);

    if (refundableAmountCents <= 0) {
        return {
            eligible: false,
            refundableAmountCents: 0,
            usedDays,
            totalDays,
            reason: 'No refundable amount remaining',
        };
    }

    return {
        eligible: true,
        refundableAmountCents,
        usedDays,
        totalDays,
        reason: null,
    };
}
