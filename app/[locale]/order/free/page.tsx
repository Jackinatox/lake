import prisma from '@/lib/prisma';
import { createPublicMetadata, getMetadataCopy } from '@/lib/metadata';
import GameCard from '@/components/order/game/gameCard';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { Gift, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const copy = getMetadataCopy(locale);

    return createPublicMetadata({
        locale,
        path: '/order/free',
        title: copy.freeOrderIndexTitle,
        description: copy.freeOrderIndexDescription,
        keywords: ['free game server', 'free gameserver', 'free minecraft server', 'free hosting'],
    });
}

export default async function OrderPage() {
    const [games, freeTierConfig] = await Promise.all([
        prisma.gameData.findMany({
            select: { id: true, name: true, slug: true },
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
        }),
        getFreeTierConfigCached(),
    ]);

    const gameCards = games.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;
        return {
            ...game,
            imageSrc: `/images/games/icons/${imgName}`,
        };
    });

    const hardwareSpecs = [
        { label: 'CPU', value: `${freeTierConfig.cpu}%` },
        { label: 'RAM', value: `${(freeTierConfig.ram / 1024).toFixed(1)} GB` },
        { label: 'Disk', value: `${(freeTierConfig.storage / 1024).toFixed(0)} GB SSD` },
        { label: 'Ports', value: `${freeTierConfig.allocations}` },
        { label: 'Backups', value: `${freeTierConfig.backupCount}` },
    ];

    return (
        <div className="-mx-2 -my-2 md:-mx-8 md:-my-4">
            {/* Hero Section */}
            <section className="relative pt-10 pb-6 md:pt-16 md:pb-10 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-green-500/5 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="relative z-10 mx-auto max-w-4xl px-4 md:px-6">
                    <div className="text-center space-y-3 md:space-y-4">
                        <Gift className="h-9 w-9 md:h-10 md:w-10 text-green-500 mx-auto" />
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance">
                            Get Your{' '}
                            <span className="text-green-500">Free</span>{' '}
                            Game Server
                        </h1>
                        <p className="flex items-center justify-center gap-1.5 text-sm md:text-base text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span>No payment required — hardware included</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Hardware + Game Selection */}
            <section className="relative z-10 mx-auto max-w-4xl px-4 md:px-6 pb-6 md:pb-8">
                <div className="grid gap-4 md:gap-6 md:grid-cols-[280px_1fr]">
                    {/* Hardware Specs - Compact List */}
                    <Card className="h-fit">
                        <CardContent className="p-4">
                            <h2 className="text-sm font-semibold text-foreground mb-3">
                                Hardware Included
                            </h2>
                            <ul className="space-y-2">
                                {hardwareSpecs.map((spec) => (
                                    <li
                                        key={spec.label}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-muted-foreground">{spec.label}</span>
                                        <span className="font-medium text-foreground">{spec.value}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                    {freeTierConfig.duration} days included free
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Game Selection */}
                    <div>
                        <h2 className="text-sm font-semibold text-foreground mb-3">
                            Select Your Game
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {gameCards.map((game) => (
                                <GameCard
                                    key={game.id}
                                    card={{
                                        link: `/order/free/${game.slug}`,
                                        name: game.name,
                                    }}
                                    imageSrc={game.imageSrc}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Accordion */}
            <section className="relative z-10 mx-auto max-w-4xl px-4 md:px-6 pb-8 md:pb-12">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="why-free" className="border rounded-lg px-4">
                        <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                            Why are the servers free?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-4">
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                            </p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </section>
        </div>
    );
}
