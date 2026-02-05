'use client';

import { Gift } from 'lucide-react';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import { PaymentItem } from './paymentItem';
import { useTranslations } from 'next-intl';
import { FreeServerPayment } from '@/models/prisma';

interface FreeServerSectionProps {
    payments: FreeServerPayment[];
}

export function FreeServerSection({ payments }: FreeServerSectionProps) {
    const t = useTranslations('payments');

    return (
            <Accordion type="single" collapsible className="w-full hover:bg-muted transition-shadow rounded-lg">
                <AccordionItem value="free-servers" className="last:border-b-0">
                    <AccordionTrigger className="w-full flex items-center justify-between p-2 md:p-3 h-auto">
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <Gift className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                            <span className="font-medium text-sm md:text-base">
                                {t('freeServers.title')}
                            </span>
                            <span className="text-muted-foreground text-xs md:text-sm">
                                ({payments.length})
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-1 md:p-2 pt-0">
                            {payments.map((pay) => (
                                <div key={pay.id} className="py-1">
                                    <PaymentItem
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
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
    );
}
