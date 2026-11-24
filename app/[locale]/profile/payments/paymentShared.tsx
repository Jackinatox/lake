'use client';

import {
    GameServerStatus,
    GameServerType,
    OrderStatus,
    OrderType,
    RefundStatus,
} from '@/app/client/generated/browser';
import { Button } from '@/components/ui/button';
import { Cog, RefreshCw, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** One order, as the payment history renders it (mobile card and desktop server group). */
export type PaymentRow = {
    amount: number;
    paymentType: OrderType;
    date: Date;
    receiptUrl?: string;
    gameServerId?: string;
    gameServerUrl?: string;
    serverName?: string;
    serverStatus?: GameServerStatus;
    serverType?: GameServerType;
    /** Current state of the server (not of the order), shown in the group header. */
    serverInfo?: {
        gameName: string;
        gameIconSlug: string | null;
        cpuPercent: number;
        ramMB: number;
        expires: Date;
    };
    orderId?: string;
    orderStatus?: OrderStatus;
    refundStatus?: RefundStatus;
    totalRefundedCents?: number;
    /** The user already used the withdrawal right on this order. */
    hasUserRefund?: boolean;
};

export function formatOrderDate(date: Date, locale: string) {
    return date.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export type ServerState = {
    /** Only expired/deleted get a hint: a date here would be the server's current expiry,
     * not the one of the order. */
    labelKey: 'serverState.expired' | 'serverState.deleted' | null;
    color: string;
    canAccessServer: boolean;
    showExtendButton: boolean;
};

export function getServerState(status?: GameServerStatus): ServerState {
    switch (status) {
        case 'EXPIRED':
            return {
                labelKey: 'serverState.expired',
                color: 'text-orange-600 dark:text-orange-400',
                canAccessServer: false,
                showExtendButton: true,
            };
        case 'DELETED':
            return {
                labelKey: 'serverState.deleted',
                color: 'text-muted-foreground',
                canAccessServer: false,
                showExtendButton: false,
            };
        default:
            // Active, created, provisioning, creation failed or no server
            return {
                labelKey: null,
                color: 'text-muted-foreground',
                canAccessServer: true,
                showExtendButton: false,
            };
    }
}

export function getOrderRefundState(row: PaymentRow) {
    const isFreeServer = row.serverType === 'FREE' || row.paymentType === 'FREE_SERVER';
    const isRefunded = row.refundStatus === 'FULL' || row.orderStatus === 'REFUNDED';
    const isPartiallyRefunded =
        row.refundStatus === 'PARTIAL' || row.orderStatus === 'PARTIALLY_REFUNDED';
    const isWithdrawn = !!row.hasUserRefund;
    const canRequestRefund =
        !!row.orderId &&
        !isFreeServer &&
        !isRefunded &&
        !isWithdrawn &&
        (row.orderStatus === 'PAID' || row.orderStatus === 'PARTIALLY_REFUNDED');

    const refundLabelKey = isRefunded
        ? 'refund.refunded'
        : isWithdrawn
          ? 'refund.withdrawn'
          : isPartiallyRefunded
            ? 'refund.partiallyRefunded'
            : null;

    return { isFreeServer, isRefunded, canRequestRefund, refundLabelKey } as const;
}

/** Manage (active), Extend (expired) or a disabled Manage (deleted / no server). */
export function ServerButton({
    gameServerUrl,
    serverStatus,
    className,
    iconClass,
}: {
    gameServerUrl?: string;
    serverStatus?: GameServerStatus;
    className?: string;
    iconClass?: string;
}) {
    const t = useTranslations('payments');
    const state = getServerState(serverStatus);

    if (gameServerUrl && state.showExtendButton) {
        return (
            <Button
                variant="outline"
                size="sm"
                className={className}
                asChild
                title={t('extendServer')}
            >
                <Link href={`${gameServerUrl}/upgrade`}>
                    <RefreshCw className={iconClass} />
                    {t('extend')}
                </Link>
            </Button>
        );
    }
    if (gameServerUrl && state.canAccessServer) {
        return (
            <Button
                variant="outline"
                size="sm"
                className={className}
                asChild
                title={t('manageServer')}
            >
                <Link href={gameServerUrl}>
                    <Settings className={iconClass} />
                    {t('manage')}
                </Link>
            </Button>
        );
    }
    return (
        <Button
            variant="outline"
            size="sm"
            className={className}
            disabled
            title={t('serverInaccessible')}
        >
            <Cog className={iconClass} />
            {t('manage')}
        </Button>
    );
}
