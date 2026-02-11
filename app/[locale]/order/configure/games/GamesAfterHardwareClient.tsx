'use client';

import GameCard from '@/components/order/game/gameCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Cpu, MemoryStick, Clock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatVCores } from '@/lib/GlobalFunctions/formatVCores';

interface GameInfo {
    id: number;
    name: string;
    slug: string;
    images: { dark: string; light: string };
}

export default function GamesAfterHardwareClient({ games }: { games: GameInfo[] }) {
    const searchParams = useSearchParams();
    const cpu = searchParams.get('cpu') ?? '4';
    const ram = searchParams.get('ram') ?? '4';
    const days = searchParams.get('days') ?? '30';
    const pf = searchParams.get('pf') ?? '';

    // Carry hardware params forward to the setup page
    const hwParams = new URLSearchParams();
    if (pf) hwParams.set('pf', pf);
    hwParams.set('cpu', cpu);
    hwParams.set('ram', ram);
    hwParams.set('days', days);
    const hwParamsStr = hwParams.toString();

    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/order/configure?${hwParamsStr}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold">Choose a Game</h1>
                            <p className="text-sm text-muted-foreground">
                                Your hardware is configured — now pick a game.
                            </p>
                        </div>
                    </div>

                    {/* Progress: step 2 of 3 */}
                    <div className="mt-4 flex gap-2">
                        <div className="h-2 flex-1 rounded bg-primary/60" />
                        <div className="h-2 flex-1 rounded bg-primary" />
                        <div className="h-2 flex-1 rounded bg-muted" />
                    </div>
                </div>
            </div>

            {/* Hardware summary */}
            <div className="w-full max-w-6xl mx-auto pt-4 px-2 md:px-6">
                <Card className="p-3 md:p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-semibold text-muted-foreground">Your Config:</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10">
                            <Cpu className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{formatVCores(parseFloat(cpu))}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10">
                            <MemoryStick className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">{ram} GiB RAM</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{days} days</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Game grid */}
            <div className="w-full max-w-6xl mx-auto pb-8 px-2 md:px-6">
                <div className="flex flex-wrap gap-4 justify-center">
                    {games.map((game) => (
                        <GameCard
                            key={game.id}
                            card={{
                                link: `/order/${game.slug}/setup?${hwParamsStr}`,
                                name: game.name,
                            }}
                            images={game.images}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
