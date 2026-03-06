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
            <section className="relative pt-6 pb-16 md:pt-16 md:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary/5" />
                <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-linear-to-t from-background to-transparent" />
                <div className="relative z-10 max-w-6xl mx-auto px-2 md:px-6">
                    <div className="mb-4 md:mb-6">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/order">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                All Games
                            </Link>
                        </Button>
                    </div>
                    <div className="text-center space-y-3 md:space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                            <Layers className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Compare Plans</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                            Pre-Configured{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                                Packages
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Pick a ready-made package, then choose your game. Instant setup, no
                            configuration needed.
                        </p>
                    </div>
                </div>
            </section>

            {/* Packages Grid */}
            <section className="relative -mt-8 md:-mt-24 pb-8 z-10">
                <div className="max-w-6xl mx-auto px-2 md:px-6">
                    {packages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {packages.map((pkg) => (
                                <PackageCard
                                    key={pkg.id}
                                    pkg={pkg}
                                    href={`/order/packages/${pkg.id}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="p-6 md:p-8 text-center">
                            <p className="text-muted-foreground">
                                No packages available at the moment. Try the custom configurator!
                            </p>
                        </Card>
                    )}
                </div>
            </section>

            {/* Custom Hardware CTA */}
            <section className="py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-2 md:px-6">
                    <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                                    <Wrench className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold mb-1">Custom Hardware</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Build your own from scratch
                                    </p>
                                </div>
                            </div>
                            <Button asChild className="shrink-0">
                                <Link href="/order/configure">Configure Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
