'use client';

import HardwareConfigurator from '@/components/order/HardwareConfigurator';
import { Button } from '@/components/ui/button';
import { PerformanceGroup } from '@/models/prisma';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ConfigurePageClientProps {
    performanceGroups: PerformanceGroup[];
    game: { id: number; name: string; slug: string };
}

export default function ConfigurePageClient({
    performanceGroups,
    game,
}: ConfigurePageClientProps) {
    const imgName = `${game.name.toLowerCase()}.webp`;

    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/order/${game.slug}`}>
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
                            <h1 className="text-xl sm:text-2xl font-bold">
                                Custom Hardware
                            </h1>
                            <p className="text-sm text-muted-foreground">{game.name}</p>
                        </div>
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
                <HardwareConfigurator
                    performanceOptions={performanceGroups}
                    continueHref={(params) => `/order/${game.slug}/setup?${params}`}
                    continueLabel="Continue to Game Setup"
                />
            </div>
        </div>
    );
}
