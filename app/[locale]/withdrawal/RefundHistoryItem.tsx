'use client';

import {
    OrderType,
    RefundServerAction,
    RefundStripeStatus,
    RefundType,
} from '@/app/client/generated/browser';
import { Button } from '@/components/ui/button';
import formatDate from '@/lib/formatDate';
import {
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Receipt,
    ExternalLink,
    FileX2,
    Undo2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface RefundHistoryItemProps {
    refundId: string;
    amount: number;
    status: RefundStripeStatus;
    type: RefundType;
    reason: string | null;
    receiptNumber: string | null;
    serverAction: RefundServerAction;
    createdAt: Date;
    orderId: string;
    orderType: OrderType;
    originalPrice: number;
    gameName: string;
    serverName?: string;
    chargeReceiptUrl?: string;
}

export function RefundHistoryItem({
    amount,
    status,
    type,
    reason,
    receiptNumber,
    serverAction,
    createdAt,
    orderType,
    originalPrice,
    gameName,
    serverName,
    chargeReceiptUrl,
}: RefundHistoryItemProps) {
    const t = useTranslations('withdrawalPage.history');
    const tPayments = useTranslations('payments');

    const getStatusConfig = () => {
        switch (status) {
            case 'SUCCEEDED':
                return {
                    label: t('status.succeeded'),
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                    variant: 'default' as const,
                    className:
                        'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
                };
            case 'PENDING':
                return {
                    label: t('status.pending'),
                    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
                    variant: 'outline' as const,
                    className:
                        'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
                };
            case 'FAILED':
                return {
                    label: t('status.failed'),
                    icon: <XCircle className="h-3.5 w-3.5" />,
                    variant: 'destructive' as const,
                    className: 'bg-destructive/10 text-destructive border-destructive/20',
                };
            case 'CANCELED':
                return {
                    label: t('status.canceled'),
                    icon: <XCircle className="h-3.5 w-3.5" />,
                    variant: 'outline' as const,
                    className: 'bg-muted text-muted-foreground',
                };
            default:
                return {
                    label: status,
                    icon: <Clock className="h-3.5 w-3.5" />,
                    variant: 'outline' as const,
                    className: '',
                };
        }
    };

    const statusConfig = getStatusConfig();
    const isWithdrawal = type === 'WITHDRAWAL';

    const getServerActionLabel = () => {
        switch (serverAction) {
            case 'SUSPEND':
                return t('serverAction.suspend');
            case 'SHORTEN':
                return t('serverAction.shorten');
            case 'NONE':
                return t('serverAction.none');
            default:
                return serverAction;
        }
    };

    return (
        <div
            className={`flex flex-col sm:flex-row sm:items-start justify-between p-3 border rounded-lg gap-3 ${
                status === 'FAILED' || status === 'CANCELED' ? 'opacity-60' : ''
            }`}
        >
            <div className="flex-1 min-w-0 space-y-1.5">
                {/* Header row */}
                <div className="flex items-center gap-2 flex-wrap">
                    {isWithdrawal ? (
                        <FileX2 className="h-4 w-4 text-orange-500 shrink-0" />
                    ) : (
                        <Undo2 className="h-4 w-4 text-blue-500 shrink-0" />
                    )}
                    <span className="font-medium text-sm">
                        {isWithdrawal ? t('typeWithdrawal') : t('typeRefund')}
                    </span>
                    <span
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium ${statusConfig.className}`}
                    >
                        {statusConfig.icon}
                        {statusConfig.label}
                    </span>
                </div>

                {/* Details */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{gameName}</span>
                    {serverName && <span>({serverName})</span>}
                    <span>•</span>
                    <span>{tPayments(`orderType.${orderType}`)}</span>
                    <span>•</span>
                    <span>{formatDate(createdAt)}</span>
                </div>

                {/* Amounts */}
                <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="font-medium text-green-600 dark:text-green-400">
                        {t('refundedAmount')}: {(amount / 100).toFixed(2)} €
                    </span>
                    <span className="text-muted-foreground">
                        {t('ofOriginal')}: {(originalPrice / 100).toFixed(2)} €
                    </span>
                </div>

                {/* Server action + reason */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>
                        {t('serverActionLabel')}: {getServerActionLabel()}
                    </span>
                    {reason && (
                        <>
                            <span>•</span>
                            <span className="italic">{reason}</span>
                        </>
                    )}
                </div>

                {/* Receipt number */}
                {receiptNumber && (
                    <div className="text-[10px] text-muted-foreground">
                        {t('receiptNumber')}: {receiptNumber}
                    </div>
                )}
            </div>

            {/* Receipt button */}
            <div className="shrink-0 flex items-center gap-1.5">
                {chargeReceiptUrl && (
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                        <Link href={chargeReceiptUrl} target="_blank" rel="noopener noreferrer">
                            <Receipt className="h-3.5 w-3.5" />
                            {t('viewReceipt')}
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
