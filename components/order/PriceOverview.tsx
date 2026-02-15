'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatVCores } from '@/lib/GlobalFunctions/formatVCores';
import type { NewPriceDef } from '@/lib/GlobalFunctions/paymentLogic';
import { useTranslations } from 'next-intl';

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

    const priceTooSmall = totalPrice.totalCents < 100;

    const totalResourceCents = totalPrice.cents.cpu + totalPrice.cents.ram;
    const discountCpu =
        totalPrice.discount.cents > 0 && totalResourceCents > 0
            ? Math.round(totalPrice.discount.cents * (totalPrice.cents.cpu / totalResourceCents))
            : 0;
    const discountRam = totalPrice.discount.cents - discountCpu;

    return (
        <Card className="shadow-lg border-2 border-primary/20">
            <CardHeader className="pb-4 bg-primary/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <CardTitle className="text-lg sm:text-xl">{tp('overviewTitle')}</CardTitle>
                </div>
                <CardDescription className="text-sm">{tp('overviewDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableCell />
                            <TableCell className="font-medium">vCPU</TableCell>
                            <TableCell className="font-medium">RAM</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">{tp('resources')}</TableCell>
                            <TableCell>{formatVCores(cpuCores)}</TableCell>
                            <TableCell>{ramGb} GiB</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">
                                {t('durations.days', { days })}
                            </TableCell>
                            <TableCell>{(totalPrice.cents.cpu / 100).toFixed(2)} €</TableCell>
                            <TableCell>{(totalPrice.cents.ram / 100).toFixed(2)} €</TableCell>
                        </TableRow>
                        {totalPrice.discount.cents > 0 && (
                            <TableRow>
                                <TableCell className="text-green-600 dark:text-green-400 font-medium">
                                    {tp('discount', { percent: totalPrice.discount.percent })}
                                </TableCell>
                                <TableCell className="text-green-600 dark:text-green-400">
                                    - {(discountCpu / 100).toFixed(2)} €
                                </TableCell>
                                <TableCell className="text-green-600 dark:text-green-400">
                                    - {(discountRam / 100).toFixed(2)} €
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="border-t pt-4 bg-muted/20 flex flex-col space-y-3 font-semibold">
                <div className="flex justify-between items-center w-full text-lg">
                    <span className="text-primary">{tp('total')}</span>
                    <span className="text-2xl font-bold text-primary">
                        {(totalPrice.totalCents / 100).toFixed(2)} €
                    </span>
                </div>
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
