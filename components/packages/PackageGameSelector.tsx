'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import GameCard from '@/components/order/game/gameCard';
import { Cpu, Database, HardDrive, MapPin, MemoryStick, Euro } from 'lucide-react';

interface PackageData {
    id: number;
    name: string;
    description: string | null;
    imageName: string;
    diskMB: number;
    ramMB: number;
    cpuPercent: number;
    backups: number;
    allocations: number;
    location: {
        id: number;
        name: string;
    };
}

interface GameOption {
    id: number;
    name: string;
}

interface PackageGameSelectorProps {
    packageData: PackageData;
    games: GameOption[];
    packageId: number;
    priceCents: number;
}

export default function PackageGameSelector({
    packageData,
    games,
    packageId,
    priceCents,
}: PackageGameSelectorProps) {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <h1 className="text-xl sm:text-2xl font-bold">Select a Game</h1>
                </div>
            </div>

            <div className="w-full pt-4 pb-8 max-w-7xl mx-auto space-y-4">
                {/* Compact Package Summary */}
                <Card className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                            {/* Package Info */}
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">
                                            {packageData.name}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            Package
                                        </Badge>
                                    </div>
                                    {packageData.description && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {packageData.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Divider - hidden on mobile */}
                            <div className="hidden sm:block h-8 w-px bg-border" />

                            {/* Compact Specs */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10">
                                    <Cpu className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">
                                        {(packageData.cpuPercent / 100).toFixed(1)} vCPU
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10">
                                    <MemoryStick className="h-4 w-4 text-purple-500" />
                                    <span className="font-medium">
                                        {(packageData.ramMB / 1024).toFixed(1)} GB RAM
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10">
                                    <HardDrive className="h-4 w-4 text-green-500" />
                                    <span className="font-medium">
                                        {(packageData.diskMB / 1024).toFixed(0)} GB
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10">
                                    <Database className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium">
                                        {packageData.backups} Backups
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{packageData.location.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="text-lg font-bold text-primary">
                                €{(priceCents / 100).toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground">/month</span>
                        </div>
                    </div>
                </Card>

                {/* Game Selection */}
                <Card className="p-4 md:p-6">
                    <h2 className="text-xl font-semibold mb-4">Choose a Game</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Select which game you want to run on this server.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        {games.map((game) => {
                            const imgName = `${game.name.toLowerCase()}.webp`;
                            const gameImages = {
                                light: `/images/light/games/icons/${imgName}`,
                                dark: `/images/dark/games/icons/${imgName}`,
                            };

                            return (
                                <GameCard
                                    key={game.id}
                                    card={{
                                        link: `/products/packages/${packageId}/${game.id}`,
                                        name: game.name,
                                    }}
                                    images={gameImages}
                                />
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
