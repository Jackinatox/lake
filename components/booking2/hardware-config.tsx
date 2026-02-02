'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateNew, NewPriceDef } from '@/lib/GlobalFunctions/paymentLogic';
import type { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import InfoButton from '../InfoButton';
import { calcBackups, calcDiskSize } from '@/lib/GlobalFunctions/ptResourceLogic';

interface HardwareConfigProps {
    performanceOptions: PerformanceGroup[];
    onPriceChange: (cents: NewPriceDef) => void;
    onNext: (config: HardwareConfig) => void;
    initialConfig: HardwareConfig | null;
}

export const HardwareConfigComponent = forwardRef(function HardwareConfig(
    { initialConfig, performanceOptions, onNext, onPriceChange }: HardwareConfigProps,
    ref,
) {
    const t = useTranslations('buyGameServer.hardware');
    const tp = useTranslations('buyGameServer.hardware.price');
    const tl = useTranslations('buyGameServer.hardware.labels');
    const tb = useTranslations('buyGameServer.hardware.button');
    const [selectedPFGroup, setSelectedPFGroup] = useState<PerformanceGroup | null>(null);
    const [priceToSmall, setPriceToSmall] = useState(false);
    const [cpuCores, setCpuCores] = useState(4);
    const [ramGb, setRamGb] = useState(4);
    const [days, setDays] = useState(30);
    const [totalPrice, setTotalPrice] = useState<NewPriceDef>({
        cents: { cpu: 0, ram: 0 },
        discount: { cents: 0, percent: 0 },
        totalCents: 0,
    });

    // Set initial values
    useEffect(() => {
        if (performanceOptions.length > 0 && !selectedPFGroup) {
            setSelectedPFGroup(performanceOptions[0]);
        }
    }, [performanceOptions, selectedPFGroup]);

    useEffect(() => {
        if (initialConfig && performanceOptions.length > 0) {
            const group = performanceOptions.find((pf) => pf.id === initialConfig.pfGroupId);
            if (group) {
                setSelectedPFGroup(group);
                setCpuCores(initialConfig.cpuPercent / 100);
                setRamGb(initialConfig.ramMb / 1024);
            }
        }
    }, [initialConfig, performanceOptions]);

    useEffect(() => {
        setPriceToSmall(totalPrice.totalCents < 100);
        onPriceChange(totalPrice);
    }, [onPriceChange, totalPrice]);

    // Calculate total price whenever configuration changes
    useEffect(() => {
        console.log(totalPrice.totalCents);
        if (selectedPFGroup?.cpu && selectedPFGroup?.ram) {
            setTotalPrice(calculateNew(selectedPFGroup, cpuCores * 100, ramGb * 1024, days));
        }
    }, [selectedPFGroup, cpuCores, ramGb, days, totalPrice.totalCents]);

    useImperativeHandle(ref, () => ({
        submit: () => {
            if (!selectedPFGroup?.cpu) return;

            const config: HardwareConfig = {
                pfGroupId: selectedPFGroup.id,
                cpuPercent: cpuCores * 100,
                ramMb: ramGb * 1024,
                backupCount: calcBackups(cpuCores * 100, ramGb * 1024),
                diskMb: calcDiskSize(cpuCores * 100, ramGb * 1024),
                durationsDays: days,
            };

            onNext(config);
        },
    }));

    if (!selectedPFGroup) {
        return <div>...</div>;
    }

    const ramOption = selectedPFGroup.ram;

    // Derived values for table (allocate discount proportionally for display if any)
    const totalResourceCents = totalPrice.cents.cpu + totalPrice.cents.ram;
    const discountCpu =
        totalPrice.discount.cents > 0 && totalResourceCents > 0
            ? Math.round(totalPrice.discount.cents * (totalPrice.cents.cpu / totalResourceCents))
            : 0;
    const discountRam = totalPrice.discount.cents - discountCpu;

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* Mobile layout: stacked cards */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Configuration Section */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <Card className="shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg sm:text-xl">{t('title')}</CardTitle>
                            <CardDescription className="text-sm">
                                {t('description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
                            {/* Performance Group Tabs */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-foreground">
                                    {t('performanceTier')}
                                </h3>
                                <Tabs
                                    value={selectedPFGroup.id.toString()}
                                    onValueChange={(value) => {
                                        const pfGroup = performanceOptions.find(
                                            (pf) => pf.id.toString() === value,
                                        );
                                        if (pfGroup) {
                                            setSelectedPFGroup(pfGroup);
                                            setCpuCores(Math.min(cpuCores, pfGroup.cpu.maxThreads));
                                        }
                                    }}
                                >
                                    <TabsList className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-auto p-1 bg-muted/50">
                                        {performanceOptions.map((pf) => (
                                            <TabsTrigger
                                                key={pf.id}
                                                value={pf.id.toString()}
                                                className="flex items-center justify-center gap-2 p-4 text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-semibold">{pf.name}</span>
                                                    <div className="flex items-center gap-1 text-xs opacity-80">
                                                        <span>{pf.cpu.name}</span>
                                                        <InfoButton
                                                            className="w-3 h-3"
                                                            text="kleine info"
                                                        />
                                                    </div>
                                                </div>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* Duration Selection */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-foreground">
                                    {t('billingPeriod')}
                                </h3>
                                <Tabs
                                    value={days.toString()}
                                    onValueChange={(value) => setDays(parseInt(value))}
                                >
                                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 h-auto p-1 bg-muted/50">
                                        <TabsTrigger
                                            value="7"
                                            className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                        >
                                            <div className="text-center">
                                                <div className="font-medium">
                                                    {t('durations.week')}
                                                </div>
                                                <div className="text-xs opacity-80">
                                                    {t('durations.days', { days: 7 })}
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="30"
                                            className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                        >
                                            <div className="text-center">
                                                <div className="font-medium">
                                                    {t('durations.month')}
                                                </div>
                                                <div className="text-xs opacity-80">
                                                    {t('durations.days', { days: 30 })}
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="90"
                                            className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                        >
                                            <div className="text-center">
                                                <div className="font-medium">
                                                    {t('durations.threeMonths')}
                                                </div>
                                                <div className="text-xs opacity-80 text-green-600">
                                                    -10%
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="180"
                                            className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                        >
                                            <div className="text-center">
                                                <div className="font-medium">
                                                    {t('durations.sixMonths')}
                                                </div>
                                                <div className="text-xs opacity-80 text-green-600">
                                                    -15%
                                                </div>
                                            </div>
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* CPU Configuration */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                    <div className="flex items-center gap-2">
                                        <div className="text-base sm:text-lg font-semibold">
                                            {cpuCores} {tl('vcpuUnit')}
                                        </div>
                                        <span className="text-xs sm:text-sm text-muted-foreground">
                                            {selectedPFGroup.cpu.name}
                                        </span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                        {(selectedPFGroup.cpu.pricePerCore / 100).toFixed(2)}{' '}
                                        {tl('perVcore')}
                                    </div>
                                </div>
                                <div className="px-2">
                                    <Slider
                                        value={[cpuCores]}
                                        min={selectedPFGroup.cpu.minThreads}
                                        max={selectedPFGroup.cpu.maxThreads}
                                        step={1}
                                        onValueChange={(value) => setCpuCores(value[0])}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>{selectedPFGroup.cpu.minThreads}</span>
                                        <span>{selectedPFGroup.cpu.maxThreads}</span>
                                    </div>
                                </div>
                            </div>

                            {/* RAM Configuration */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                                    <div className="text-base sm:text-lg font-semibold">
                                        {ramGb} {tl('ramUnit')}
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                        {(selectedPFGroup.ram.pricePerGb / 100).toFixed(2)}{' '}
                                        {tl('perGiB')}
                                    </div>
                                </div>
                                <div className="px-2">
                                    <Slider
                                        value={[ramGb]}
                                        min={ramOption.minGb}
                                        max={ramOption.maxGb}
                                        step={1}
                                        onValueChange={(value) => setRamGb(value[0])}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>{ramOption.minGb} GB</span>
                                        <span>{ramOption.maxGb} GB</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Price Overview Section */}
                <div className="order-1 lg:order-2">
                    <div className="lg:sticky lg:top-4">
                        <Card className="shadow-lg border-2 border-primary/20">
                            <CardHeader className="pb-4 bg-primary/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    <CardTitle className="text-lg sm:text-xl">
                                        {tp('overviewTitle')}
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-sm">
                                    {tp('overviewDescription')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4">
                                {/* Detailed Table */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableCell></TableCell>
                                            <TableCell className="font-medium">vCPU</TableCell>
                                            <TableCell className="font-medium">RAM</TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-medium">
                                                {tp('resources')}
                                            </TableCell>
                                            <TableCell>
                                                {cpuCores} vCore{cpuCores > 1 ? 's' : ''}
                                            </TableCell>
                                            <TableCell>{ramGb} GiB</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium">
                                                {t('durations.days', { days })}
                                            </TableCell>
                                            <TableCell>
                                                {(totalPrice.cents.cpu / 100).toFixed(2)} €
                                            </TableCell>
                                            <TableCell>
                                                {(totalPrice.cents.ram / 100).toFixed(2)} €
                                            </TableCell>
                                        </TableRow>
                                        {totalPrice.discount.cents > 0 && (
                                            <TableRow>
                                                <TableCell className="text-green-600 dark:text-green-400 font-medium">
                                                    {tp('discount', {
                                                        percent: totalPrice.discount.percent,
                                                    })}
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
                                    disabled={priceToSmall}
                                    onClick={() => {
                                        if (!selectedPFGroup?.cpu) return;
                                        const config: HardwareConfig = {
                                            pfGroupId: selectedPFGroup.id,
                                            cpuPercent: cpuCores * 100,
                                            ramMb: ramGb * 1024,
                                            diskMb: calcDiskSize(cpuCores * 100, ramGb * 1024),
                                            backupCount: calcBackups(cpuCores * 100, ramGb * 1024),
                                            durationsDays: days,
                                        };
                                        onNext(config);
                                    }}
                                >
                                    {tb('continue')}
                                </Button>
                                {priceToSmall && (
                                    <span className="text-xs text-red-500 text-center">
                                        {tp('minOrderHint')}
                                    </span>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
});
