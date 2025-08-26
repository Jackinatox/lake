"use client"

import Loading from "@/app/[locale]/gameserver/[server_id]/upgrade/loading"
import InfoButton from "@/components/InfoButton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCaption, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateBase, calculateUpgradeCost, UpgradePriceDef } from "@/lib/GlobalFunctions/paymentLogic"
import type { HardwareConfig } from "@/models/config"
import { PerformanceGroup } from "@/models/prisma"
import { Info } from "lucide-react"
import { useEffect, useState } from "react"
import { calcDiskSize } from "@/lib/GlobalFunctions/ptResourceLogic"

interface HardwareConfigProps {
    diskOptions?: { id: number; size_gb: number; price_per_gb: number }[]
    performanceOptions: PerformanceGroup[]
    onNext: (config: HardwareConfig) => void
    initialConfig: HardwareConfig | null
}

export function UpgradeHardwareConfig({ initialConfig, performanceOptions, onNext }: HardwareConfigProps) {
    const [selectedPFGroup, setSelectedPFGroup] = useState<PerformanceGroup | null>(null);

    const [cpuCores, setCpuCores] = useState(initialConfig.cpuPercent / 100)
    const [ramGb, setRamGb] = useState(initialConfig.ramMb / 1024)
    const [days, setDays] = useState(0);
    const [totalPrice, setTotalPrice] = useState<UpgradePriceDef>({ totalCents: 0, upgradeCents: { cpu: 0, ram: 0 }, extendCents: { cpu: 0, ram: 0 }, discount: { cents: 0, percent: 0 } });

    // Set initial values
    useEffect(() => {
        if (performanceOptions.length > 0 && !selectedPFGroup) {
            setSelectedPFGroup(performanceOptions[0])
        }
    }, [performanceOptions, selectedPFGroup])

    useEffect(() => {
        if (initialConfig && performanceOptions.length > 0) {
            const group = performanceOptions.find(pf => pf.id === initialConfig.pfGroupId)
            if (group) {
                setSelectedPFGroup(group)
                setCpuCores(initialConfig.cpuPercent / 100)
                setRamGb(initialConfig.ramMb / 1024)
            }
        }
    }, [initialConfig, performanceOptions])


    // Calculate total price whenever configuration changes
    useEffect(() => {
        if (selectedPFGroup?.cpu && selectedPFGroup?.ram) {
            const upgradeByCPU = (cpuCores * 100) - initialConfig.cpuPercent;
            const upgradeByRAM = (ramGb * 1024) - initialConfig.ramMb;
            // setTotalPrice(calculateTotal("UPGRADE", selectedPFGroup, upgradeCPU * 100, upgradeRAM * 1024, initialConfig.durationsDays + days));
            const upgradeBy: HardwareConfig = { cpuPercent: upgradeByCPU, ramMb: upgradeByRAM, durationsDays: days, pfGroupId: selectedPFGroup.id, diskMb: initialConfig.diskMb };

            setTotalPrice(calculateUpgradeCost(initialConfig, upgradeBy, selectedPFGroup));
            console.log(`upgradeBy: ${JSON.stringify(upgradeBy)}`);
        }
    }, [selectedPFGroup, cpuCores, ramGb, days])


    if (!selectedPFGroup) {
        return <Loading />
    }

    const ramOption = selectedPFGroup.ram;

    return (
        <div className="w-full max-w-7xl mx-auto">
            debug days: {initialConfig.durationsDays} ramGb to upgrade: {ramGb - initialConfig.ramMb / 1024} cpucores to upgrade: {cpuCores - initialConfig.cpuPercent / 100}
            <Card className="mb-6 shadow border border-primary/30">
                <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Info className="text-primary" />
                        <span>Upgrade Information</span>
                        {/* <InfoButton text="Learn more about hardware upgrades" /> */}
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Hier ist es nur möglich den Server zu verlängern oder upzugraden. Für Downgrades mus du hier schauen TODO: Link
                    </CardDescription>
                </CardHeader>
            </Card>
            {/* Mobile layout: stacked cards */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Configuration Section */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <Card className="shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg sm:text-xl">Performance Configuration</CardTitle>
                            <CardDescription className="text-sm">Customize your server hardware.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
                            {/* Performance Group Tabs */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-foreground">Performance Tier</h3>
                                <Tabs
                                    value={selectedPFGroup.id.toString()}
                                    onValueChange={(value) => {
                                        const pfGroup = performanceOptions.find((pf) => pf.id.toString() === value);
                                        if (pfGroup) {
                                            setSelectedPFGroup(pfGroup);
                                            setCpuCores(Math.min(cpuCores, pfGroup.cpu.maxThreads));
                                        }
                                    }}
                                >
                                    <TabsList className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-auto p-1 bg-muted/50">
                                        {performanceOptions.map((pf) => (
                                            <TabsTrigger
                                                disabled={true}
                                                key={pf.id}
                                                value={pf.id.toString()}
                                                className="flex items-center justify-center gap-2 p-4 text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-semibold">{pf.name}</span>
                                                    <div className="flex items-center gap-1 text-xs opacity-80">
                                                        <span>{pf.cpu.name}</span>
                                                        <InfoButton className="w-3 h-3" text="kleine info" />
                                                    </div>
                                                </div>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* Duration Selection */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-foreground">Extend Server</h3>
                                <Tabs
                                    value={days.toString()}
                                    onValueChange={(value) => setDays(parseInt(value))}
                                >
                                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 h-auto p-1 bg-muted/50">
                                        <TabsTrigger value="0" className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <div className="text-center">
                                                <div className="font-medium">None</div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger value="7" className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <div className="text-center">
                                                <div className="font-medium">1 Week</div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger value="30" className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <div className="text-center">
                                                <div className="font-medium">1 Month</div>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger value="90" className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            <div className="text-center">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <span>3 Months</span>
                                                    <span className="text-sm opacity-80 text-green-500 font-bold">-10%</span>
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
                                        <div className="text-base sm:text-lg font-semibold">{cpuCores} vCore(s)</div>
                                        <span className="text-xs sm:text-sm text-muted-foreground">{selectedPFGroup.cpu.name}</span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">{(selectedPFGroup.cpu.pricePerCore / 100).toFixed(2)} € / vCore</div>
                                </div>
                                <div className="px-2">
                                    <Slider
                                        value={[cpuCores]}
                                        min={selectedPFGroup.cpu.minThreads}
                                        max={selectedPFGroup.cpu.maxThreads}
                                        step={1}
                                        onValueChange={(value) => setCpuCores(Math.max(value[0], initialConfig.cpuPercent / 100))}
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
                                    <div className="text-base sm:text-lg font-semibold">{ramGb} GiB RAM</div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">{(selectedPFGroup.ram.pricePerGb / 100).toFixed(2)} € / GiB</div>
                                </div>
                                <div className="px-2">
                                    <Slider
                                        value={[ramGb]}
                                        min={ramOption.minGb}
                                        max={ramOption.maxGb}
                                        step={1}
                                        onValueChange={(value) => setRamGb(Math.max(value[0], initialConfig.ramMb / 1024))}
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
                                    <CardTitle className="text-lg sm:text-xl">Price Overview</CardTitle>
                                </div>
                                <CardDescription className="text-sm">
                                    Summary of your configuration.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4">
                                <div className="space-y-3">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableCell></TableCell>
                                                <TableCell>vCPU</TableCell>
                                                <TableCell>RAM</TableCell>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Upgrade für {initialConfig.durationsDays} Tage</TableCell>
                                                <TableCell>{(totalPrice.upgradeCents.cpu / 100).toFixed(2)} €</TableCell>
                                                <TableCell>{(totalPrice.upgradeCents.ram / 100).toFixed(2)} €</TableCell>
                                            </TableRow>

                                            <TableRow>
                                                {totalPrice.discount.cents > 0 ?
                                                    <TableCell>Verlängerung für {days} Tage<div className="text-primary">(zzgl. {(totalPrice.discount.cents / 100).toFixed(2)} € Rabatt)</div></TableCell> :
                                                    <TableCell>Verlängerung für {days} Tage</TableCell>}
                                                <TableCell>{(totalPrice.extendCents.cpu / 100).toFixed(2)} €</TableCell>
                                                <TableCell>{(totalPrice.extendCents.ram / 100).toFixed(2)} €</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 bg-muted/20 flex flex-col space-y-3 font-semibold">
                                {/* <div className="flex justify-between items-center w-full text-muted-foreground">
                  <span className="text-sm">Price per Month</span>
                  <span className="text-sm"> {calculateTotal(selectedPFGroup, cpuCores, ramGb, 30).price} €</span>
                </div> */}
                                <div className="flex justify-between items-center w-full text-lg">
                                    <span className="text-primary">Total</span>
                                    <span className="text-2xl font-bold text-primary">{(totalPrice.totalCents / 100).toFixed(2)} €</span>
                                </div>
                                <Button
                                    className="w-full font-bold"
                                    size="lg"
                                    onClick={() => {
                                        if (!selectedPFGroup) return;
                                        const cpuPercent = Math.round(cpuCores * 100);
                                        const ramMb = Math.round(ramGb * 1024);
                                        const config: HardwareConfig = {
                                            pfGroupId: selectedPFGroup.id,
                                            cpuPercent,
                                            ramMb,
                                            diskMb: calcDiskSize(cpuPercent, ramMb),
                                            durationsDays: days,
                                        };
                                        onNext(config);
                                    }}
                                >
                                    Continue to Payment
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

