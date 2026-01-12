'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentItem } from './paymentItem';
import { useTranslations } from 'next-intl';
import { GameServerStatus, GameServerType, OrderType } from '@/app/client/generated/browser';

interface FreeServerPayment {
    id: number;
    price: number;
    type: OrderType;
    createdAt: Date;
    receipt_url: string | null;
    gameServer: {
        ptServerId: string | null;
        status: GameServerStatus;
        type: GameServerType;
        id: string;
    } | null;
}

interface FreeServerSectionProps {
    payments: FreeServerPayment[];
}

export function FreeServerSection({ payments }: FreeServerSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations('payments');

    return (
        <div className="border rounded-lg">
            <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-2 md:p-3 h-auto"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-1.5 md:gap-2">
                    <Gift className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                    <span className="font-medium text-sm md:text-base">
                        {t('freeServers.title')}
                    </span>
                    <span className="text-muted-foreground text-xs md:text-sm">
                        ({payments.length})
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
            </Button>

            {isOpen && (
                <div className="p-2 md:p-3 pt-0 space-y-2 md:space-y-3">
                    {payments.map((pay) => (
                        <PaymentItem
                            key={pay.id}
                            amount={pay.price}
                            paymentType={pay.type}
                            date={pay.createdAt}
                            receiptUrl={pay.receipt_url ?? undefined}
                            gameServerUrl={
                                pay.gameServer?.ptServerId
                                    ? `/gameserver/${pay.gameServer.ptServerId}`
                                    : undefined
                            }
                            serverStatus={pay.gameServer?.status}
                            serverType={pay.gameServer?.type}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
