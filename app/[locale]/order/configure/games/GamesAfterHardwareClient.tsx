'use client';

import GameCard from '@/components/order/game/gameCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Archive, Clock, Cpu, HardDrive, MemoryStick, Network } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import { percentToVCores } from '@/lib/GlobalFunctions/formatVCores';
import { GameData, PerformanceGroup, ResourceTier } from '@/models/prisma';

type GameCard = Pick<GameData, 'id' | 'name' | 'slug'> & { images: { dark: string; light: string } };

interface Props {
    games: GameCard[];
    resourceTiers: ResourceTier[];
    performanceGroups: PerformanceGroup[];
}

export default function GamesAfterHardwareClient({ games, resourceTiers, performanceGroups }: Props) {
    const searchParams = useSearchParams();
    const locale = useLocale();
    const daysSuffix = locale === 'de' ? 'T' : 'd';
    const cpu = searchParams.get('cpu') ?? '4';
    const ram = searchParams.get('ram') ?? '4';
    const days = searchParams.get('days') ?? '30';
    const pf = searchParams.get('pf') ?? '';
    const tierId = searchParams.get('tier') ?? '';

    const selectedTier = tierId
        ? (resourceTiers.find((t) => t.id === Number(tierId)) ?? null)
        : null;

    const selectedPfGroup = pf
        ? (performanceGroups.find((g) => g.id === Number(pf)) ?? null)
        : (performanceGroups[0] ?? null);

    const totalCents = (() => {
        if (!selectedPfGroup) return null;
        const price = calculateNew(selectedPfGroup, parseFloat(cpu) * 100, parseFloat(ram) * 1024, Number(days));
        return price.totalCents + (selectedTier?.priceCents ?? 0);
    })();

    // Carry hardware params forward to the setup page
    const hwParams = new URLSearchParams();
    if (pf) hwParams.set('pf', pf);
    hwParams.set('cpu', cpu);
    hwParams.set('ram', ram);
    hwParams.set('days', days);
    if (tierId) hwParams.set('tier', tierId);
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
                    <div className="flex items-center gap-2 md:gap-3 p-3 overflow-x-auto scrollbar-none">
                        {/* Primary specs */}
                        <Chip color="blue" label="CPU">
                            <Cpu className="h-3.5 w-3.5 text-blue-500" />
                            {percentToVCores(parseFloat(cpu) * 100)}
                        </Chip>

                        <Chip color="purple" label="RAM">
                            <MemoryStick className="h-3.5 w-3.5 text-purple-500" />
                            {ram}
                        </Chip>

                        {selectedTier && (
                            <Chip color="green" label="Disk">
                                <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                                {selectedTier.diskMB / 1024}
                            </Chip>
                        )}

                        <div className="w-px h-5 bg-border shrink-0" />

                        {/* Secondary specs */}
                        <Chip color="muted" label="Duration">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {days}{daysSuffix}
                        </Chip>

                        {selectedTier && (
                            <>
                                <Chip color="muted" label="Backups">
                                    <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                                    {selectedTier.backups}
                                </Chip>

                                <Chip color="muted" label="Ports">
                                    <Network className="h-3.5 w-3.5 text-muted-foreground" />
                                    {selectedTier.ports}
                                </Chip>
                            </>
                        )}

                        {totalCents != null && (
                            <>
                                <div className="w-px h-5 bg-border shrink-0 ml-auto" />
                                <Chip color="primary">
                                    {(totalCents / 100).toFixed(2)} €
                                </Chip>
                            </>
                        )}
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
                                link: `/order/${game.slug}/setup?${hwParamsStr}&mode=configured`,
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

function Chip({
    color,
    label,
    children,
}: {
    color: 'blue' | 'purple' | 'green' | 'muted' | 'primary';
    label?: string;
    children: React.ReactNode;
}) {
    const bg: Record<string, string> = {
        blue: 'bg-blue-500/10',
        purple: 'bg-purple-500/10',
        green: 'bg-emerald-500/10',
        muted: 'bg-muted',
        primary: 'bg-primary/10 text-primary font-semibold',
    };
    return (
        <div
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${bg[color]}`}
        >
            {children}
            {label && <span className="hidden sm:inline text-muted-foreground font-normal">{label}</span>}
        </div>
    );
}
