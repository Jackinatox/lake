'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PackageCard, { PackageDisplay } from '@/components/order/PackageCard';
import { ArrowLeft, ArrowRight, Gift, Wrench } from 'lucide-react';

interface GameLandingProps {
    game: { id: number; name: string; slug: string };
    packages: PackageDisplay[];
    hasFreeServers: boolean;
    recommendation: { recCpuPercent: number; recRamMb: number } | null;
}

export default function GameLandingClient({
    game,
    packages,
    hasFreeServers,
    recommendation,
}: GameLandingProps) {
    const imgName = `${game.name.toLowerCase()}.webp`;
    const gameImages = {
        light: `/images/light/games/icons/${imgName}`,
        dark: `/images/dark/games/icons/${imgName}`,
    };

    // Build custom configure URL with recommendation defaults
    const configureParams = new URLSearchParams();
    if (recommendation) {
        configureParams.set('cpu', String(recommendation.recCpuPercent / 100));
        configureParams.set('ram', String(recommendation.recRamMb / 1024));
    }
    const configureHref = `/order/${game.slug}/configure${configureParams.toString() ? `?${configureParams.toString()}` : ''}`;

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <section className="space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/order">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        All Games
                    </Link>
                </Button>

                <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                        <Image
                            src={gameImages.light}
                            alt={game.name}
                            fill
                            className="object-cover rounded-xl block dark:hidden"
                        />
                        <Image
                            src={gameImages.dark}
                            alt={game.name}
                            fill
                            className="object-cover rounded-xl hidden dark:block"
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-4xl font-bold">{game.name}</h1>
                        <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Choose a package or configure custom hardware
                        </p>
                    </div>
                </div>
            </section>

            {/* Action Banners */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Custom Configuration Banner */}
                <Link href={configureHref} className="group block">
                    <div className="rounded-lg border bg-card hover:bg-accent/50 transition-colors pr-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Wrench className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                                    Custom Configuration
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Configure CPU, RAM, and duration
                                </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                    </div>
                </Link>

                {/* Free Server Banner */}
                {hasFreeServers && (
                    <Link href={`/order/free/${game.slug}`} className="group block">
                        <div className="rounded-lg border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-colors pr-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                                    <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-green-700 dark:text-green-300">
                                            Free Server
                                        </h3>
                                    </div>
                                    <p className="text-xs text-green-700/70 dark:text-green-300/70">
                                        Limited resources • No credit card
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                            </div>
                        </div>
                    </Link>
                )}
            </section>

            {/* Packages Grid */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Pre-configured Packages</h2>
                {packages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {packages.map((pkg) => (
                            <PackageCard
                                key={pkg.id}
                                pkg={pkg}
                                href={`/order/${game.slug}/package/${pkg.id}`}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center">
                        <p className="text-muted-foreground">
                            No pre-configured packages available for this game yet. Try the custom
                            configurator above!
                        </p>
                    </Card>
                )}
            </section>
        </div>
    );
}
