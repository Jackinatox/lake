'use client';

import { Button } from '@/components/ui/button';
import { Receipt, Server, AlertCircle, Cog } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { OrderType } from '@/app/client/generated/browser';

interface PaymentItemProps {
    amount: number;
    paymentType: OrderType;
    date: Date;
    receiptUrl?: string;
    gameServerUrl?: string;
    serverExpired?: boolean;
    locale?: string;
}

export function PaymentItem({
    amount,
    paymentType,
    date,
    receiptUrl,
    gameServerUrl,
    serverExpired = false,
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

    return (
        <div className="flex justify-between items-center p-3 border rounded-lg">
            <div>
                <p className="font-medium">{t(`orderType.${paymentType}`)}</p>
                <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
                {serverExpired && (
                    <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-orange-500">{t('serverExpired')}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className="font-medium">{(amount / 100).toFixed(2)} €</span>
                <Button variant="outline" asChild>
                    {receiptUrl ? (
                        <Link href={receiptUrl} target="_blank" rel="noopener noreferrer">
                            <Receipt className="h-5 w-5" />
                        </Link>
                    ) : (
                        <span
                            title={t('noReceipt')}
                            className="inline-flex items-center justify-center opacity-50 cursor-not-allowed"
                            aria-disabled
                        >
                            <Receipt className="h-5 w-5" />
                        </span>
                    )}
                </Button>
                {gameServerUrl &&
                    (serverExpired ? (
                        <Button variant="outline" disabled>
                            <Cog className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button variant="outline" asChild>
                            <Link href={gameServerUrl} target="_blank" rel="noopener noreferrer">
                                <Cog className="h-5 w-5" />
                            </Link>
                        </Button>
                    ))}
            </div>
        </div>
    );
}
