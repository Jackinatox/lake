'use client';

import PerformanceConfigurator, {
    ResourceTierDisplay,
} from '@/components/order/PerformanceConfigurator';
import { Button } from '@/components/ui/button';
import { HardwareRecommendationSlim, PerformanceGroup } from '@/models/prisma';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';

interface ConfiguredOrderClientProps {
    performanceGroups: PerformanceGroup[];
    resourceTiers: ResourceTierDisplay[];
    game: { id: number; name: string; slug: string };
    hasFreeServers: boolean;
    hardwareRecommendations: HardwareRecommendationSlim[];
}

interface PriceInfo {
    totalCents: number;
    disabled: boolean;
    onContinue: () => void;
}

export default function ConfiguredOrderClient({
    performanceGroups,
    resourceTiers,
    game,
    hardwareRecommendations,
}: ConfiguredOrderClientProps) {
    const imgName = `${game.name.toLowerCase()}.webp`;

    const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);

    const handlePriceUpdate = useCallback((info: PriceInfo) => {
        setPriceInfo(info);
    }, []);

    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-2">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                            <Link href="/order">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="relative w-8 h-8 shrink-0">
                            <Image
                                src={`/images/light/games/icons/${imgName}`}
                                alt={game.name}
                                fill
                                className="object-cover rounded-md block dark:hidden"
                            />
                            <Image
                                src={`/images/dark/games/icons/${imgName}`}
                                alt={game.name}
                                fill
                                className="object-cover rounded-md hidden dark:block"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base sm:text-lg font-bold leading-tight">
                                {game.name}
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Configure your server
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
            <div className="w-full pt-4 pb-24 lg:pb-8 max-w-7xl mx-auto">
                <PerformanceConfigurator
                    performanceOptions={performanceGroups}
                    resourceTiers={resourceTiers}
                    hardwareRecommendations={hardwareRecommendations}
                    continueHref={(params) => `/order/${game.slug}/setup?${params}&mode=configured`}
                    continueLabel="Continue to Setup"
                    onPriceUpdate={handlePriceUpdate}
                />
            </div>

            {/* Sticky bottom bar — mobile only */}
            {priceInfo && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-t p-3 flex items-center gap-3">
                    <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-2xl font-bold text-primary">
                            {(priceInfo.totalCents / 100).toFixed(2)} €
                        </div>
                    </div>
                    <Button
                        size="lg"
                        className="font-bold px-6"
                        disabled={priceInfo.disabled}
                        onClick={priceInfo.onContinue}
                    >
                        Continue
                    </Button>
                </div>
            )}
        </div>
    );
}
