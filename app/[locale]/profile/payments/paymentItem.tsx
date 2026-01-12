'use client';

import { GameServerStatus, GameServerType, OrderType } from '@/app/client/generated/browser';
import { Button } from '@/components/ui/button';
import {
    AlertCircle,
    CheckCircle2,
    Cog,
    Receipt,
    RefreshCw,
    Settings,
    XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface PaymentItemProps {
    amount: number;
    paymentType: OrderType;
    date: Date;
    receiptUrl?: string;
    gameServerUrl?: string;
    serverStatus?: GameServerStatus;
    serverType?: GameServerType;
    locale?: string;
}

type StatusConfig = {
    label: string;
    icon: React.ReactNode;
    color: string;
    canAccessServer: boolean;
    showExtendButton: boolean;
};

export function PaymentItem({
    amount,
    paymentType,
    date,
    receiptUrl,
    gameServerUrl,
    serverStatus,
    serverType,
    locale = 'de',
}: PaymentItemProps) {
    const t = useTranslations('payments');

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    // Map server status to UI configuration (simplified: Created, Expired, Deleted)
    const getStatusConfig = (status?: GameServerStatus): StatusConfig => {
        switch (status) {
            case 'EXPIRED':
                return {
                    label: t('status.expired'),
                    icon: <AlertCircle className="h-3 w-3" />,
                    color: 'text-orange-500',
                    canAccessServer: false,
                    showExtendButton: true,
                };
            case 'DELETED':
                return {
                    label: t('status.deleted'),
                    icon: <XCircle className="h-3 w-3" />,
                    color: 'text-muted-foreground',
                    canAccessServer: false,
                    showExtendButton: false,
                };
            default:
                // Created, Active, Creation_Failed, or provisioning - all shown as "Created"
                return {
                    label: t('status.created'),
                    icon: <CheckCircle2 className="h-3 w-3" />,
                    color: 'text-green-500',
                    canAccessServer: true,
                    showExtendButton: false,
                };
        }
    };

    const statusConfig = getStatusConfig(serverStatus);
    const isFreeServer = serverType === 'FREE' || paymentType === 'FREE_SERVER';

    return (
        <div className="flex justify-between items-center p-2 md:p-3 border rounded-lg gap-2">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <p className="font-medium text-sm md:text-base">
                        {t(`orderType.${paymentType}`)}
                    </p>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{formatDate(date)}</p>
                {/* Status indicator */}
                <div
                    className={`flex items-center gap-0.5 md:gap-1 mt-0.5 md:mt-1 ${statusConfig.color}`}
                >
                    {statusConfig.icon}
                    <span className="text-[10px] md:text-xs">{statusConfig.label}</span>
                </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                {!isFreeServer && (
                    <span className="font-medium text-sm md:text-base whitespace-nowrap">
                        {(amount / 100).toFixed(2)} €
                    </span>
                )}

                {/* Receipt button */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9"
                    asChild={!!receiptUrl}
                >
                    {receiptUrl ? (
                        <Link
                            href={receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t('viewReceipt')}
                        >
                            <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Link>
                    ) : (
                        <span
                            title={t('noReceipt')}
                            className="inline-flex items-center justify-center opacity-50 cursor-not-allowed"
                            aria-disabled
                        >
                            <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </span>
                    )}
                </Button>

                {/* Server action buttons */}
                {gameServerUrl && (
                    <>
                        {statusConfig.showExtendButton ? (
                            // Expired: Show extend/upgrade button
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 md:h-9 md:w-9"
                                asChild
                                title={t('extendServer')}
                            >
                                <Link href={`${gameServerUrl}/upgrade`}>
                                    <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                </Link>
                            </Button>
                        ) : statusConfig.canAccessServer ? (
                            // Active/Created: Show server access button
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 md:h-9 md:w-9"
                                asChild
                                title={t('manageServer')}
                            >
                                <Link href={gameServerUrl}>
                                    <Settings className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                </Link>
                            </Button>
                        ) : (
                            // Deleted/Failed: Show disabled button
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 md:h-9 md:w-9"
                                disabled
                                title={t('serverInaccessible')}
                            >
                                <Cog className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                        )}
                    </>
                )}

                {/* No server URL - show disabled cog */}
                {!gameServerUrl && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 md:h-9 md:w-9"
                        disabled
                        title={t('status.created')}
                    >
                        <Cog className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
