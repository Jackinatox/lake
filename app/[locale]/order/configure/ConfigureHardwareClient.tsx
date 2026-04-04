'use client';

import PerformanceConfigurator from '@/components/order/PerformanceConfigurator';
import { Button } from '@/components/ui/button';
import { PerformanceGroup, ResourceTierDisplay } from '@/models/prisma';
import { ArrowLeft, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';

interface ConfigureHardwareClientProps {
    performanceGroups: PerformanceGroup[];
    resourceTiers: ResourceTierDisplay[];
}

interface PriceInfo {
    totalCents: number;
    disabled: boolean;
    onContinue: () => void;
}

export default function ConfigureHardwareClient({
    performanceGroups,
    resourceTiers,
}: ConfigureHardwareClientProps) {
    const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);

    const handlePriceUpdate = useCallback((info: PriceInfo) => {
        setPriceInfo(info);
    }, []);

    return (
        <div className="md:-my-4 flex flex-col min-h-[calc(100dvh-4rem)]">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-2">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                            <Link href="/order">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Wrench className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base sm:text-lg font-bold leading-tight">
                                Configure Hardware
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Configure your hardware, then choose a game
                            </p>
                        </div>
                        {priceInfo && (
                            <div className="text-right shrink-0">
                                <div className="text-xl font-bold text-primary">
                                    {(priceInfo.totalCents / 100).toFixed(2)} €
                                </div>
                                <div className="text-xs text-muted-foreground">total</div>
                            </div>
                        )}
                    </div>

                    {/* Progress: step 1 of 3 */}
                    <div className="mt-2 flex gap-2">
                        <div className="h-1.5 flex-1 rounded bg-primary" />
                        <div className="h-1.5 flex-1 rounded bg-muted" />
                        <div className="h-1.5 flex-1 rounded bg-muted" />
                    </div>
                </div>
            </div>

            {/* Configurator */}
            <div className="w-full pt-4 pb-4 lg:pb-8 max-w-7xl mx-auto flex-1">
                <PerformanceConfigurator
                    performanceOptions={performanceGroups}
                    resourceTiers={resourceTiers}
                    continueHref={(params) => `/order/configure/games?${params}`}
                    continueLabel="Choose a Game"
                    onPriceUpdate={handlePriceUpdate}
                />
            </div>

            {/* Sticky bottom bar — mobile only */}
            {priceInfo && (
                <div className="lg:hidden sticky bottom-0 z-20 bg-background/95 backdrop-blur-md border-t p-3 flex items-center gap-3">
                    <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-2xl font-bold text-primary">
                            {(priceInfo.totalCents / 100).toFixed(2)} €
                        </div>
                    </div>
                    <Button
                        size="lg"
                        className="font-bold px-8"
                        disabled={priceInfo.disabled}
                        onClick={priceInfo.onContinue}
                    >
                        Choose a Game
                    </Button>
                </div>
            )}
        </div>
    );
}
