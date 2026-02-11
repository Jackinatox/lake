'use client';

import HardwareConfigurator from '@/components/order/HardwareConfigurator';
import { Button } from '@/components/ui/button';
import { PerformanceGroup } from '@/models/prisma';
import { ArrowLeft, Layers, Wrench } from 'lucide-react';
import Link from 'next/link';

interface HardwareFirstClientProps {
    performanceGroups: PerformanceGroup[];
}

export default function HardwareFirstClient({ performanceGroups }: HardwareFirstClientProps) {
    return (
        <div className="md:-my-4">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b py-4">
                <div className="w-full px-1 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/order">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold">Custom Hardware</h1>
                            <p className="text-sm text-muted-foreground">
                                Configure your hardware, then choose a game
                            </p>
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
                {/* Package alternative banner */}
                <div className="mb-6 mx-auto max-w-7xl">
                    <Link
                        href="/order/packages"
                        className="block rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Layers className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <span className="font-semibold">Prefer a ready-made package?</span>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Browse pre-configured packages with instant setup — no hardware
                                    decisions needed.
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                <HardwareConfigurator
                    performanceOptions={performanceGroups}
                    continueHref={(params) => `/order/configure/games?${params}`}
                    continueLabel="Choose a Game"
                />
            </div>
        </div>
    );
}
