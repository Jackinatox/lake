'use client';

import PackageCard, { PackageDisplay } from '@/components/order/PackageCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Layers, Wrench } from 'lucide-react';
import Link from 'next/link';

interface PackagesListClientProps {
    packages: PackageDisplay[];
}

export default function PackagesListClient({ packages }: PackagesListClientProps) {
    return (
        <div className="-mx-2 -my-2 md:-mx-8 md:-my-4">
            {/* Hero */}
            <section className="relative pt-16 pb-32 md:pt-24 md:pb-44 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute bottom-0 left-0 right-0 h-32 md:h-44 bg-linear-to-t from-background to-transparent" />
                <div className="relative z-10 mx-auto max-w-6xl px-2 md:px-6">
                    <div className="mb-8">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/order">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                All Games
                            </Link>
                        </Button>
                    </div>
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                            <Layers className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Compare Plans</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                            Pre-Configured{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                                Packages
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Pick a ready-made package, then choose your game. Instant setup, no
                            configuration needed.
                        </p>
                    </div>
                </div>
            </section>

            {/* Packages Grid */}
            <section className="relative -mt-20 md:-mt-32 pb-8 z-10">
                <div className="mx-auto max-w-6xl px-2 md:px-6">
                    {packages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map((pkg) => (
                                <PackageCard
                                    key={pkg.id}
                                    pkg={pkg}
                                    href={`/order/packages/${pkg.id}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">
                                No packages available at the moment. Try the custom configurator!
                            </p>
                        </Card>
                    )}
                </div>
            </section>

            {/* Custom Hardware CTA */}
            <section className="py-12 md:py-16">
                <div className="mx-auto max-w-4xl px-2 md:px-6">
                    <div className="relative rounded-2xl border bg-card p-6 md:p-10 overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                            <div className="shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Wrench className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold mb-2">Need More Control?</h2>
                                <p className="text-muted-foreground">
                                    Configure your own server from scratch. Choose CPU, RAM,
                                    duration, and more — then pick a game.
                                </p>
                            </div>
                            <Button asChild size="lg" className="shrink-0">
                                <Link href="/order/configure">
                                    <Wrench className="h-4 w-4 mr-2" />
                                    Custom Hardware
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
