'use server';

import GameCard from '@/components/order/game/gameCard';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, MousePointerClick } from 'lucide-react';

interface ChangeGameSelectProps {
    serverId: string;
}

async function ChangeGameSelect({ serverId }: ChangeGameSelectProps) {
    const data = await prisma.gameData.findMany({
        select: {
            id: true,
            slug: true,
            name: true,
        },
        where: { enabled: true },
        orderBy: { sorting: 'asc' },
    });

    if (!data || data.length === 0) {
        return <div>No Games.</div>;
    }

    const games = data.map((game) => ({
        ...game,
        imageSrc: `/images/games/icons/${game.name.toLowerCase()}.webp`,
    }));

    return (
        <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
            {/* Sticky top bar — sits below the navbar in flow, then sticks on scroll */}
            <div className="sticky top-0 z-40 -mx-2 md:-mx-8 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto w-full max-w-5xl px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <Gamepad2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground truncate">
                                Choose a Game
                            </span>
                        </div>
                        <Link
                            href={`/gameserver/${serverId}`}
                            className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Game grid — flex-1 pushes sticky bar to viewport bottom on short pages */}
            <div className="flex-1 mx-auto w-full max-w-5xl px-0 pt-4 pb-4">
                <div className="flex flex-wrap gap-4 justify-center">
                    {games.map((game) => (
                        <GameCard
                            key={game.id}
                            card={{
                                link: `/gameserver/${serverId}/changeGame/${game.slug}`,
                                name: game.name ?? '',
                            }}
                            imageSrc={game.imageSrc}
                        />
                    ))}
                </div>
            </div>

            {/* Sticky bottom bar — breaks out of layout's px-2 md:px-8 padding */}
            <div className="sticky bottom-0 z-40 -mx-2 md:-mx-8 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto w-full max-w-5xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
                        <MousePointerClick className="h-4 w-4 shrink-0" />
                        <span>Select a game to continue to configuration</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChangeGameSelect;
