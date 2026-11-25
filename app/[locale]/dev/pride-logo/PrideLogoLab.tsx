'use client';

import PrideLogo from '@/components/brand/prideLogo/PrideLogo';
import { VARIANTS } from '@/components/brand/prideLogo/variants';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';
import { CONCEPTS } from './concepts';

const PANELS = [
    {
        mode: 'light' as const,
        className: 'bg-white text-black border-zinc-200',
        navClass: 'bg-zinc-50 border-zinc-200 text-zinc-700',
        logoText: 'text-black',
    },
    {
        mode: 'dark' as const,
        className: 'bg-zinc-950 text-white border-zinc-800',
        navClass: 'bg-zinc-900 border-zinc-800 text-zinc-300',
        logoText: 'text-white',
    },
];

export default function PrideLogoLab() {
    const [duration, setDuration] = useState(800);
    const [autoplay, setAutoplay] = useState(false);
    const [scrubOn, setScrubOn] = useState(false);
    const [scrub, setScrub] = useState(0);

    const common = { duration, autoplay, scrub: scrubOn ? scrub : null };

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-16">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Pride logo lab</h1>
                <p className="text-sm text-muted-foreground">
                    J3 (six blocks on the line) grows into J5 (the whole cloud). Desktop: hover a
                    logo. Phone: tap it, and tap again to go back. Every logo runs on its own. Dev
                    server only.
                </p>
            </header>

            <section className="z-20 grid sm:sticky sm:top-2 gap-4 rounded-xl border bg-background/95 p-4 shadow-sm backdrop-blur sm:grid-cols-3">
                <div className="space-y-2">
                    <Label>Duration: {duration} ms</Label>
                    <Slider
                        min={250}
                        max={2500}
                        step={50}
                        value={[duration]}
                        onValueChange={([v]) => setDuration(v)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
                    <Label htmlFor="autoplay">Auto-play loop</Label>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Switch id="scrub" checked={scrubOn} onCheckedChange={setScrubOn} />
                        <Label htmlFor="scrub">Scrub by hand: {Math.round(scrub * 100)}%</Label>
                    </div>
                    <Slider
                        min={0}
                        max={1}
                        step={0.005}
                        value={[scrub]}
                        disabled={!scrubOn}
                        onValueChange={([v]) => setScrub(v)}
                    />
                </div>
            </section>

            {VARIANTS.map((v) => (
                <section key={v.id} className="overflow-hidden rounded-xl border">
                    <div className="space-y-1 p-4">
                        <h2 className="font-semibold">{v.name}</h2>
                        <p className="text-sm text-muted-foreground">{v.description}</p>
                    </div>
                    <div className="grid sm:grid-cols-2">
                        {PANELS.map((panel) => (
                            <div
                                key={panel.mode}
                                className={cn('flex flex-col gap-5 border-t p-5', panel.className)}
                            >
                                <span className="text-xs opacity-60">{panel.mode} mode</span>
                                <PrideLogo
                                    variant={v.id}
                                    mode={panel.mode}
                                    {...common}
                                    className="mx-auto w-full max-w-sm cursor-pointer"
                                />
                                <div
                                    className={cn(
                                        'flex items-center gap-4 rounded-lg border px-3 py-2 text-sm',
                                        panel.navClass,
                                    )}
                                >
                                    <PrideLogo
                                        variant={v.id}
                                        mode={panel.mode}
                                        {...common}
                                        className={cn(
                                            'h-10 shrink-0 cursor-pointer',
                                            panel.logoText,
                                        )}
                                    />
                                    <span className="ml-auto">Games</span>
                                    <span className="hidden min-[400px]:inline">Pricing</span>
                                    <span>Support</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            <header className="mt-8 space-y-1">
                <h2 className="text-xl font-semibold">Earlier concepts (static)</h2>
                <p className="text-sm text-muted-foreground">
                    Every logo from the design rounds, for review. Not animated.
                </p>
            </header>
            {[...new Set(CONCEPTS.map((c) => c.round))].map((round) => (
                <div key={round} className="flex flex-col gap-6">
                    <h3 className="font-semibold text-muted-foreground">{round}</h3>
                    {CONCEPTS.filter((c) => c.round === round).map((c) => (
                        <section key={c.slug} className="overflow-hidden rounded-xl border">
                            <div className="space-y-1 p-4">
                                <h4 className="font-semibold">{c.title}</h4>
                                <p className="text-sm text-muted-foreground">{c.description}</p>
                            </div>
                            <div className="grid sm:grid-cols-2">
                                {PANELS.map((panel) => {
                                    const src = `/images/pride/concepts/${c.slug}-${panel.mode}.webp`;
                                    return (
                                        <div
                                            key={panel.mode}
                                            className={cn(
                                                'flex flex-col gap-5 border-t p-5',
                                                panel.className,
                                            )}
                                        >
                                            <span className="text-xs opacity-60">
                                                {panel.mode} mode
                                            </span>
                                            <Image
                                                src={src}
                                                alt={`${c.title}, ${panel.mode} mode`}
                                                width={c.width}
                                                height={c.height}
                                                className="mx-auto h-auto w-full max-w-sm"
                                            />
                                            <div
                                                className={cn(
                                                    'flex items-center gap-4 rounded-lg border px-3 py-2 text-sm',
                                                    panel.navClass,
                                                )}
                                            >
                                                <Image
                                                    src={src}
                                                    alt=""
                                                    width={c.width}
                                                    height={c.height}
                                                    className="h-10 w-auto shrink-0"
                                                />
                                                <span className="ml-auto">Games</span>
                                                <span className="hidden min-[400px]:inline">
                                                    Pricing
                                                </span>
                                                <span>Support</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ))}
        </div>
    );
}
