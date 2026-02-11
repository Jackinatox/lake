'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    ArrowRight,
    Cpu,
    Database,
    Gift,
    HardDrive,
    MapPin,
    MemoryStick,
    Wrench,
    Star,
} from 'lucide-react';

interface PackageDisplay {
    id: number;
    name: string;
    description: string | null;
    imageName: string;
    diskMB: number;
    ramMB: number;
    cpuPercent: number;
    backups: number;
    locationName: string;
    priceCents: number;
    preselected: boolean;
}

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
        <div className="-mx-2 -my-2 md:-mx-8 md:-my-4">
            {/* Hero Section */}
            <section className="relative pt-12 pb-28 md:pt-20 md:pb-40 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute bottom-0 left-0 right-0 h-32 md:h-44 bg-linear-to-t from-background to-transparent" />
                <div className="relative z-10 mx-auto max-w-6xl px-2 md:px-6">
                    {/* Back link */}
                    <div className="mb-8">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/order">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                All Games
                            </Link>
                        </Button>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                            <Image
                                src={gameImages.light}
                                alt={game.name}
                                fill
                                className="object-cover rounded-2xl block dark:hidden shadow-lg"
                            />
                            <Image
                                src={gameImages.dark}
                                alt={game.name}
                                fill
                                className="object-cover rounded-2xl hidden dark:block shadow-lg"
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                                {game.name}
                            </h1>
                            <p className="text-muted-foreground mt-1 text-lg">
                                Choose a package to get started, or configure custom hardware.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Packages Grid */}
            <section className="relative -mt-16 md:-mt-28 pb-8 z-10">
                <div className="mx-auto max-w-6xl px-2 md:px-6">
                    {packages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map((pkg) => (
                                <PackageCardLink
                                    key={pkg.id}
                                    pkg={pkg}
                                    gameSlug={game.slug}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">
                                No pre-configured packages available for this game yet. Try the
                                custom configurator below!
                            </p>
                        </Card>
                    )}
                </div>
            </section>

            {/* Custom Hardware CTA */}
            <section className="py-8 md:py-12">
                <div className="mx-auto max-w-6xl px-2 md:px-6">
                    <div className="relative rounded-2xl border bg-card p-6 md:p-10 overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                            <div className="flex-shrink-0">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Wrench className="h-7 w-7 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-xl font-bold mb-1">Custom Configuration</h2>
                                <p className="text-muted-foreground text-sm">
                                    Want full control? Configure CPU, RAM, and duration exactly the
                                    way you want it.
                                </p>
                            </div>
                            <Button asChild size="lg" className="shrink-0">
                                <Link href={configureHref}>
                                    <Wrench className="h-4 w-4 mr-2" />
                                    Configure Hardware
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Free Server Link */}
            {hasFreeServers && (
                <section className="pb-12">
                    <div className="mx-auto max-w-6xl px-2 md:px-6">
                        <Link
                            href={`/order/free/${game.slug}`}
                            className="block rounded-xl border border-green-500/20 bg-green-500/5 p-4 md:p-6 transition-colors hover:bg-green-500/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                    <Gift className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            Try for Free
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="bg-green-500/20 text-green-600 text-xs"
                                        >
                                            Free
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Get a free {game.name} server with limited resources to try
                                        it out.
                                    </p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-green-500 shrink-0" />
                            </div>
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}

function PackageCardLink({
    pkg,
    gameSlug,
}: {
    pkg: PackageDisplay;
    gameSlug: string;
}) {
    return (
        <Link
            href={`/order/${gameSlug}/package/${pkg.id}`}
            className="group block"
        >
            <div className="relative h-full rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-muted-foreground/20 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={`/images/light/packages/${pkg.imageName}`}
                        alt={pkg.name}
                        fill
                        className="object-cover dark:hidden blur-[1.5px]"
                    />
                    <Image
                        src={`/images/dark/packages/${pkg.imageName}`}
                        alt={pkg.name}
                        fill
                        className="object-cover hidden dark:block blur-[1.5px]"
                    />
                    <div className="absolute inset-0 bg-background/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 md:p-6 space-y-4 h-full flex flex-col">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors">
                                {pkg.name}
                            </h3>
                            {pkg.preselected && (
                                <Badge
                                    variant="secondary"
                                    className="bg-amber-500/20 text-amber-600 border-amber-500/30"
                                >
                                    <Star className="h-3 w-3 mr-1" />
                                    Recommended
                                </Badge>
                            )}
                        </div>
                        {pkg.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {pkg.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border bg-blue-500/10 border-blue-500/30">
                            <Cpu className="h-5 w-5 text-blue-500" />
                            <div>
                                <div className="text-sm font-semibold">
                                    {(pkg.cpuPercent / 100).toFixed(1)}
                                </div>
                                <div className="text-xs text-muted-foreground">vCPU</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border bg-purple-500/10 border-purple-500/30">
                            <MemoryStick className="h-5 w-5 text-purple-500" />
                            <div>
                                <div className="text-sm font-semibold">
                                    {(pkg.ramMB / 1024).toFixed(1)} GB
                                </div>
                                <div className="text-xs text-muted-foreground">RAM</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border bg-green-500/10 border-green-500/30">
                            <HardDrive className="h-5 w-5 text-green-500" />
                            <div>
                                <div className="text-sm font-semibold">
                                    {(pkg.diskMB / 1024).toFixed(0)} GB
                                </div>
                                <div className="text-xs text-muted-foreground">Storage</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg backdrop-blur-sm border bg-orange-500/10 border-orange-500/30">
                            <Database className="h-5 w-5 text-orange-500" />
                            <div>
                                <div className="text-sm font-semibold">{pkg.backups}</div>
                                <div className="text-xs text-muted-foreground">Backups</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t mt-auto">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{pkg.locationName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-lg font-bold text-primary">
                                    €{(pkg.priceCents / 100).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">/month</div>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            >
                                Select
                                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
