'use client';

import { Gift } from 'lucide-react';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import { ServerPaymentGroups } from './ServerPaymentGroups';
import { PaymentRow } from './paymentShared';
import { useTranslations } from 'next-intl';

interface FreeServerSectionProps {
    rows: PaymentRow[];
}

export function FreeServerSection({ rows }: FreeServerSectionProps) {
    const t = useTranslations('payments');

    return (
        <Accordion
            type="single"
            collapsible
            className="w-full hover:bg-muted transition-shadow rounded-lg"
        >
            <AccordionItem value="free-servers" className="last:border-b-0">
                <AccordionTrigger className="w-full flex items-center justify-between p-2 md:p-3 h-auto">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <Gift className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                        <span className="font-medium text-sm md:text-base">
                            {t('freeServers.title')}
                        </span>
                        <span className="text-muted-foreground text-xs md:text-sm">
                            ({rows.length})
                        </span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-1 pt-0 md:p-2">
                        <ServerPaymentGroups rows={rows} />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
