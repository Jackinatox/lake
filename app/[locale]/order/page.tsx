import prisma from '@/lib/prisma';
import { Gamepad2, Layers, Wrench } from 'lucide-react';
import GameCard from '@/components/order/game/gameCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function OrderPage() {
    const games = await prisma.gameData.findMany({
        select: { id: true, name: true, slug: true },
        where: { enabled: true },
        orderBy: { sorting: 'asc' },
    });

    const gameCards = games.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;
        return {
            ...game,
            images: {
                dark: `/images/dark/games/icons/${imgName}`,
                light: `/images/light/games/icons/${imgName}`,
            },
        };
    });

    return (
        <div className="-mx-2 -my-2 md:-mx-8 md:-my-4">
            {/* Hero */}
            <section className="relative pt-16 pb-32 md:pt-24 md:pb-44 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute bottom-0 left-0 right-0 h-32 md:h-44 bg-linear-to-t from-background to-transparent" />
                <div className="relative z-10 mx-auto max-w-6xl px-2 md:px-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                            <Gamepad2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Game Server Hosting</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                            Choose Your{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                                Game
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Select a game to see available packages, or design your own server with
                            custom hardware.
                        </p>
                    </div>
                </div>
            </section>

            {/* Game Grid */}
            <section className="relative -mt-20 md:-mt-32 pb-8 z-10">
                <div className="mx-auto max-w-6xl px-2 md:px-6">
                    <div className="flex flex-wrap gap-4 justify-center">
                        {gameCards.map((game) => (
                            <GameCard
                                key={game.id}
                                card={{
                                    link: `/order/${game.slug}`,
                                    name: game.name,
                                }}
                                images={game.images}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 md:py-16">
                <div className="mx-auto max-w-6xl px-2 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Compare Plans CTA */}
                        <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                                        <Layers className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold mb-1">Compare Packages</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Pre-configured plans ready to go
                                        </p>
                                    </div>
                                </div>
                                <Button asChild className="shrink-0">
                                    <Link href="/order/packages">View Packages</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Custom Hardware CTA */}
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
                </div>
            </section>
        </div>
    );
}
