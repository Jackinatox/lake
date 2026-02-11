'use client';

import GameCard from '@/components/order/game/gameCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Cpu, Database, HardDrive, MapPin, MemoryStick } from 'lucide-react';
import Link from 'next/link';

interface PackageSummary {
    id: number;
    name: string;
    cpuPercent: number;
    ramMB: number;
    diskMB: number;
    backups: number;
    locationName: string;
    priceCents: number;
}

interface GameInfo {
    id: number;
    name: string;
    slug: string;
    images: { dark: string; light: string };
}

interface PackageGamesClientProps {
    packageSummary: PackageSummary;
    games: GameInfo[];
}

export default function PackageGamesClient({ packageSummary, games }: PackageGamesClientProps) {
    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/order/packages">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">Choose a Game</h1>
                                <p className="text-sm text-muted-foreground">
                                    Select a game for your {packageSummary.name} package
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="text-sm text-muted-foreground hidden sm:inline">
                                From:
                            </span>
                            <span className="text-lg font-bold text-primary">
                                €{(packageSummary.priceCents / 100).toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">/mo</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Package summary */}
            <div className="w-full max-w-6xl mx-auto pt-4 px-2 md:px-6">
                <Card className="p-3 md:p-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <span className="font-semibold text-muted-foreground shrink-0">
                            {packageSummary.name}:
                        </span>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10">
                                <Cpu className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                    {(packageSummary.cpuPercent / 100).toFixed(0)} vCPU
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10">
                                <MemoryStick className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">
                                    {(packageSummary.ramMB / 1024).toFixed(0)} GB RAM
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10">
                                <HardDrive className="h-4 w-4 text-green-500" />
                                <span className="font-medium">
                                    {(packageSummary.diskMB / 1024).toFixed(0)} GB
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10">
                                <Database className="h-4 w-4 text-orange-500" />
                                <span className="font-medium">
                                    {packageSummary.backups} Backups
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{packageSummary.locationName}</span>
                            </div>
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
                                link: `/order/${game.slug}/package/${packageSummary.id}`,
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
