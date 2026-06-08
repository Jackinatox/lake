'use client';

import { OrderType } from '@/app/client/generated/browser';
import { RefundRequestButton } from '@/components/payments/RefundRequestButton';
import { WITHDRAWAL_WINDOW_DAYS } from '@/lib/refund/refundLogic';
import { Gamepad2, Clock, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WithdrawableOrderItemProps {
    orderId: string;
    orderType: OrderType;
    price: number;
    createdAt: Date;
    expiresAt: Date;
    gameName: string;
    serverName?: string;
    existingRefunds: Array<{
        id: string;
        amount: number;
        status: string;
        type: string;
        isAutomatic: boolean;
    }>;
}

export function WithdrawableOrderItem({
    orderId,
    orderType,
    price,
    createdAt,
    expiresAt,
    gameName,
    serverName,
    existingRefunds,
}: WithdrawableOrderItemProps) {
    const t = useTranslations('withdrawalPage.eligibleOrders');
    const tPayments = useTranslations('payments');

    const created = new Date(createdAt);
    const now = new Date();
    const daysSincePurchase = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysRemaining = Math.max(0, WITHDRAWAL_WINDOW_DAYS - daysSincePurchase);

    const alreadyRefundedCents = existingRefunds
        .filter((r) => r.status === 'SUCCEEDED' || r.status === 'PENDING')
        .reduce((sum, r) => sum + r.amount, 0);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <div className="flex flex-row items-center justify-between p-3 border rounded-lg gap-3">
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <Gamepad2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-sm">{gameName}</span>
                    {serverName && (
                        <span className="text-xs text-muted-foreground">({serverName})</span>
                    )}
                    <span className="text-[10px] text-muted-foreground before:content-['·'] before:mr-1">
                        {tPayments(`orderType.${orderType}`)}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{formatDate(created)}</span>
                    <span className="font-medium text-foreground">
                        {(price / 100).toFixed(2)} €
                    </span>
                    {alreadyRefundedCents > 0 && (
                        <span className="flex items-center gap-0.5">
                            <Undo2 className="h-3 w-3" />
                            {t('alreadyRefunded')}: {(alreadyRefundedCents / 100).toFixed(2)} €
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span
                        className={
                            daysRemaining <= 3
                                ? 'text-orange-500 font-medium'
                                : 'text-muted-foreground'
                        }
                    >
                        {t('daysRemaining', { days: daysRemaining })}
                    </span>
                </div>
            </div>

            <div className="shrink-0 self-center">
                <RefundRequestButton orderId={orderId} orderAmount={price} />
            </div>
        </div>
    );
}
