'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatVCores } from '@/lib/GlobalFunctions/formatVCores';
import type { NewPriceDef } from '@/lib/GlobalFunctions/paymentLogic';
import { useTranslations } from 'next-intl';
import { Cpu, MemoryStick, HardDrive, Tag, TrendingUp } from 'lucide-react';

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
            {/* Resource cards */}
            <div className="grid grid-cols-2 gap-px bg-border">
                <ResourceTile
                    icon={Cpu}
                    label={formatVCores(cpuCores)}
                    sublabel="vCPU"
                    price={totalPrice.cents.cpu}
                />
                <ResourceTile
                    icon={MemoryStick}
                    label={`${ramGb} GiB`}
                    sublabel="RAM"
                    price={totalPrice.cents.ram}
                />
            </div>

            <CardContent className="pt-3 pb-0 space-y-1.5 sm:space-y-2">
                {/* Duration tag */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{tp('resources')}</span>
                    <span className="font-medium">{duration}</span>
                </div>

                {/* Storage tier */}
                {totalPrice.tierPriceCents > 0 && (
                    <Row icon={HardDrive} label={to('storageTier')}>
                        +{(totalPrice.tierPriceCents / 100).toFixed(2)} €
                    </Row>
                )}

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
                <div className="flex items-baseline justify-between border-t pt-2 mt-1 sm:pt-3 sm:mt-3">
                    <span className="text-sm text-muted-foreground">{tp('total')}</span>
                    <span className="text-2xl font-bold tabular-nums">
                        {(grandTotalCents / 100).toFixed(2)} €
                    </span>
                </div>
            </CardContent>

            <CardFooter className="pt-3 flex flex-col gap-2">
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

function ResourceTile({
    icon: Icon,
    label,
    sublabel,
    price,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sublabel: string;
    price: number;
}) {
    return (
        <div className="flex flex-col gap-1 sm:gap-2 bg-card px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{sublabel}</span>
            </div>
            <div className="font-semibold text-sm">{label}</div>
            <div className="text-xs text-muted-foreground tabular-nums">
                {(price / 100).toFixed(2)} €
            </div>
        </div>
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
    children: React.ReactNode;
}) {
    const color = green
        ? 'text-green-600 dark:text-green-400'
        : orange
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-foreground';
    return (
        <div className={`flex items-center justify-between text-sm ${color}`}>
            <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{label}</span>
            </div>
            <span className="tabular-nums font-medium">{children}</span>
        </div>
    );
}
