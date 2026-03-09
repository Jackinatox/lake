'use client';

import PerformanceConfigurator, {
    ResourceTierDisplay,
} from '@/components/order/PerformanceConfigurator';
import { Button } from '@/components/ui/button';
import { PerformanceGroup } from '@/models/prisma';
import { ArrowLeft, Gift } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ConfiguredOrderClientProps {
    performanceGroups: PerformanceGroup[];
    resourceTiers: ResourceTierDisplay[];
    game: { id: number; name: string; slug: string };
    hasFreeServers: boolean;
}

export default function ConfiguredOrderClient({
    performanceGroups,
    resourceTiers,
    game,
    hasFreeServers,
}: ConfiguredOrderClientProps) {
    const imgName = `${game.name.toLowerCase()}.webp`;

    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/order">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div className="relative w-10 h-10 shrink-0">
                                <Image
                                    src={`/images/light/games/icons/${imgName}`}
                                    alt={game.name}
                                    fill
                                    className="object-cover rounded-lg block dark:hidden"
                                />
                                <Image
                                    src={`/images/dark/games/icons/${imgName}`}
                                    alt={game.name}
                                    fill
                                    className="object-cover rounded-lg hidden dark:block"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">{game.name}</h1>
                                <p className="text-sm text-muted-foreground">Configure your server</p>
                            </div>
                        </div>

                        {hasFreeServers && (
                            <Button variant="outline" size="sm" asChild className="shrink-0 border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/10 hover:border-green-500/60">
                                <Link href={`/order/free/${game.slug}`}>
                                    <Gift className="h-4 w-4 mr-1.5" />
                                    Free server
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* Progress: step 1 of 3 */}
                    <div className="mt-4 flex gap-2">
                        <div className="h-2 flex-1 rounded bg-primary" />
                        <div className="h-2 flex-1 rounded bg-muted" />
                        <div className="h-2 flex-1 rounded bg-muted" />
                    </div>
                </div>
            </div>

            {/* Configurator */}
            <div className="w-full pt-4 pb-8 max-w-7xl mx-auto">
                <PerformanceConfigurator
                    performanceOptions={performanceGroups}
                    resourceTiers={resourceTiers}
                    continueHref={(params) => `/order/${game.slug}/setup?${params}&mode=configured`}
                    continueLabel="Continue to Game Setup"
                />
            </div>
        </div>
    );
}
