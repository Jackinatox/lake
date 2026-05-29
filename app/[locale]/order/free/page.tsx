import prisma from '@/lib/prisma';
import { createPublicMetadata, getMetadataCopy } from '@/lib/metadata';
import GameCard from '@/components/order/game/gameCard';
import {
    FREE_TIER_ALLOCATIONS,
    FREE_TIER_BACKUP_COUNT,
    FREE_TIER_CPU_PERCENT,
    FREE_TIER_RAM_MB,
    FREE_TIER_STORAGE_MB,
} from '@/app/GlobalConstants';
import { getKeyValueNumber } from '@/lib/keyValue';
import { formatMB } from '@/lib/GlobalFunctions/ptResourceLogic';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import { Gift } from 'lucide-react';
import FreeServerSpecs from './FreeServerSpecs';
import type { Metadata } from 'next';

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
    const [games, cpuPercent, ramMb, storageMb, backups, ports] = await Promise.all([
        prisma.gameData.findMany({
            select: { id: true, name: true, slug: true },
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
        }),
        getKeyValueNumber(FREE_TIER_CPU_PERCENT),
        getKeyValueNumber(FREE_TIER_RAM_MB),
        getKeyValueNumber(FREE_TIER_STORAGE_MB),
        getKeyValueNumber(FREE_TIER_BACKUP_COUNT),
        getKeyValueNumber(FREE_TIER_ALLOCATIONS),
    ]);

    const gameCards = games.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;
        return {
            ...game,
            imageSrc: `/images/games/icons/${imgName}`,
        };
    });

    return (
        <div className="-mx-2 -my-2 md:-mx-8 md:-my-4">
            <section className="relative pt-16 pb-32 md:pt-24 md:pb-44 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-primary/5" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="absolute bottom-0 left-0 right-0 h-32 md:h-44 bg-linear-to-t from-background to-transparent" />
                <div className="relative z-10 mx-auto max-w-6xl px-2 md:px-6">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <Gift className="h-10 w-10 text-green-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                            Choose Your{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                                Game
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Select a game for your{' '}
                            <span className="text-green-500 font-medium">free</span> server
                        </p>
                    </div>
                </div>
            </section>

            <section className="relative -mt-20 md:-mt-32 pb-6 z-10">
                <div className="mx-auto max-w-4xl px-2 md:px-6">
                    <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Included Hardware
                    </h2>
                    <FreeServerSpecs
                        cpu={formatVCoresFromPercent(cpuPercent)}
                        ram={formatMB(ramMb)}
                        disk={formatMB(storageMb)}
                        backups={backups}
                        ports={ports}
                    />
                </div>
            </section>

            <section className="pb-8 z-10">
                <div className="mx-auto max-w-6xl px-2 md:px-6">
                    <div className="flex flex-wrap gap-4 justify-center">
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
            </section>
        </div>
    );
}
