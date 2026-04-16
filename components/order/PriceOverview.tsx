'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatVCores } from '@/lib/GlobalFunctions/formatVCores';
import type { NewPriceDef } from '@/lib/GlobalFunctions/paymentLogic';
import { useTranslations } from 'next-intl';
import { Cpu, MemoryStick, HardDrive, Tag, TrendingUp, Clock } from 'lucide-react';

interface PriceOverviewProps {
    cpuCores: number;
    ramGb: number;
    days: number;
    totalPrice: NewPriceDef;
    onContinue: () => void;
    continueLabel?: string;
    disableContinue?: boolean;
}

export default function PriceOverview({
    cpuCores,
    ramGb,
    days,
    totalPrice,
    onContinue,
    continueLabel,
    disableContinue,
}: PriceOverviewProps) {
    const t = useTranslations('buyGameServer.hardware');
    const tp = useTranslations('buyGameServer.hardware.price');
    const tb = useTranslations('buyGameServer.hardware.button');
    const to = useTranslations('order');

    const grandTotalCents = totalPrice.totalCents;
    const priceTooSmall = grandTotalCents < 100;
    const duration = t('durations.days', { days });

    return (
        <Card className="shadow-lg overflow-hidden">
            <CardContent className="px-4 pt-4 pb-0 md:px-6 md:pt-6 md:pb-0 space-y-1.5 sm:space-y-2">
                {/* CPU */}
                <Row icon={Cpu} label={`${formatVCores(cpuCores)}`}>
                    {(totalPrice.cents.cpu / 100).toFixed(2)} €
                </Row>

                {/* RAM */}
                <Row icon={MemoryStick} label={`${ramGb} GiB RAM`}>
                    {(totalPrice.cents.ram / 100).toFixed(2)} €
                </Row>

                {/* Storage tier */}
                {totalPrice.tierPriceCents > 0 && (
                    <Row icon={HardDrive} label={to('storageTier')}>
                        {(totalPrice.tierPriceCents / 100).toFixed(2)} €
                    </Row>
                )}

                {/* Duration */}
                <Row icon={Clock} label={duration} />

                {/* Discount */}
                {totalPrice.discount.cents > 0 && (
                    <Row
                        icon={Tag}
                        label={tp('discount', { percent: totalPrice.discount.percent })}
                        green
                    >
                        -{(totalPrice.discount.cents / 100).toFixed(2)} €
                    </Row>
                )}

                {/* Surcharge (negative discount = price increase) */}
                {totalPrice.discount.cents < 0 && (
                    <Row
                        icon={TrendingUp}
                        label={tp('surcharge', { percent: Math.abs(totalPrice.discount.percent) })}
                        orange
                    >
                        +{(Math.abs(totalPrice.discount.cents) / 100).toFixed(2)} €
                    </Row>
                )}

                {/* Total */}
                <div className="flex items-center justify-between border-t pt-3 mt-3 sm:pt-3 sm:mt-4">
                    <span className="text-sm text-muted-foreground">{tp('total')}</span>
                    <span className="text-2xl font-bold tabular-nums">
                        {(grandTotalCents / 100).toFixed(2)} €
                    </span>
                </div>
            </CardContent>

            <CardFooter className="px-4 pt-2.5 pb-3.5 md:px-6 md:pt-3.5 md:pb-5 flex flex-col gap-2">
                <Button
                    className="w-full font-bold"
                    size="lg"
                    disabled={priceTooSmall || disableContinue}
                    onClick={onContinue}
                >
                    {continueLabel ?? tb('continue')}
                </Button>
                {priceTooSmall && (
                    <span className="text-xs text-red-500 text-center">{tp('minOrderHint')}</span>
                )}
            </CardFooter>
        </Card>
    );
}

function Row({
    icon: Icon,
    label,
    green,
    orange,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    green?: boolean;
    orange?: boolean;
    children?: React.ReactNode;
}) {
    const color = green
        ? 'text-green-600 dark:text-green-400'
        : orange
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-muted-foreground';
    return (
        <div className={`flex items-center justify-between text-sm ${color}`}>
            <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{label}</span>
            </div>
            {children && (
                <span className="tabular-nums font-medium text-foreground">{children}</span>
            )}
        </div>
    );
}
