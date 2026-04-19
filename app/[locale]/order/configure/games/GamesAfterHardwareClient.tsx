'use client';

import GameCard from '@/components/order/game/gameCard';
import HardwareChipBar from '@/components/order/HardwareChipBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import { GameData, PerformanceGroup, ResourceTier } from '@/models/prisma';

type GameCard = Pick<GameData, 'id' | 'name' | 'slug'> & {
    imageSrc: string;
};

function parseFiniteNumber(value: string | null, fallback: number) {
    if (value == null || value.trim().length === 0) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveInt(value: string | null) {
    if (!value) return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return null;
    return parsed;
}

interface Props {
    games: GameCard[];
    resourceTiers: ResourceTier[];
    performanceGroups: PerformanceGroup[];
}

export default function GamesAfterHardwareClient({
    games,
    resourceTiers,
    performanceGroups,
}: Props) {
    const searchParams = useSearchParams();
    const cpu = parseFiniteNumber(searchParams.get('cpu'), 4);
    const ram = parseFiniteNumber(searchParams.get('ram'), 4);
    const days = Math.max(1, Math.round(parseFiniteNumber(searchParams.get('days'), 30)));
    const pf = parsePositiveInt(searchParams.get('pf'));
    const tierId = parsePositiveInt(searchParams.get('tier'));

    const selectedTier = tierId ? (resourceTiers.find((t) => t.id === tierId) ?? null) : null;

    const selectedPfGroup = pf
        ? (performanceGroups.find((g) => g.id === pf) ?? null)
        : (performanceGroups[0] ?? null);

    const totalCents = (() => {
        if (!selectedPfGroup) return null;
        const price = calculateNew(
            selectedPfGroup,
            cpu * 100,
            ram * 1024,
            days,
            selectedTier?.priceCents ?? 0,
        );
        return price.totalCents;
    })();

    // Carry hardware params forward to the setup page
    const hwParams = new URLSearchParams();
    if (selectedPfGroup) hwParams.set('pf', String(selectedPfGroup.id));
    hwParams.set('cpu', String(cpu));
    hwParams.set('ram', String(ram));
    hwParams.set('days', String(days));
    if (selectedTier) hwParams.set('tier', String(selectedTier.id));
    const hwParamsStr = hwParams.toString();

    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-2">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                            <Link href={`/order/configure?${hwParamsStr}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base sm:text-lg font-bold leading-tight">
                                Choose a Game
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Hardware configured — now pick a game
                            </p>
                        </div>
                    </div>

                    {/* Progress: step 2 of 3 */}
                    <div className="mt-2 flex gap-2">
                        <div className="h-1.5 flex-1 rounded bg-primary/60" />
                        <div className="h-1.5 flex-1 rounded bg-primary" />
                        <div className="h-1.5 flex-1 rounded bg-muted" />
                    </div>
                </div>
            </div>

            {/* Hardware summary */}
            <div className="w-full max-w-6xl mx-auto pt-4 px-2 md:px-6">
                <Card className="mb-6">
                    <HardwareChipBar
                        cpu={cpu}
                        ram={ram}
                        days={days}
                        diskGB={selectedTier ? selectedTier.diskMB / 1024 : 0}
                        backups={selectedTier?.backups ?? 0}
                        ports={selectedTier?.ports ?? 0}
                        totalCents={totalCents ?? 0}
                        className="p-3"
                    />
                </Card>
            </div>

            {/* Game grid */}
            <div className="w-full max-w-6xl mx-auto pb-8 px-2 md:px-6">
                <div className="flex flex-wrap gap-4 justify-center">
                    {games.map((game) => (
                        <GameCard
                            key={game.id}
                            card={{
                                link: `/order/${game.slug}/setup?${hwParamsStr}&mode=configured`,
                                name: game.name,
                            }}
                            imageSrc={game.imageSrc}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
