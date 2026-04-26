import prisma from '@/lib/prisma';
import { fetchPerformanceGroups } from '@/lib/actions';
import { createPublicMetadata, getMetadataCopy } from '@/lib/metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConfiguredOrderClient from './ConfiguredOrderClient';
import { Suspense, cache } from 'react';

// Old imports — kept so the file is easy to restore
// import GameLandingClient from './GameLandingClient';
// import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';

const getGameLandingPageData = cache(async (gameSlug: string) => {
    return Promise.all([
        prisma.gameData.findUnique({
            where: { slug: gameSlug, enabled: true },
            select: {
                id: true,
                name: true,
                slug: true,
                hardwareRecommendations: {
                    orderBy: { sorting: 'asc' },
                    select: {
                        id: true,
                        eggId: true,
                        minCpuPercent: true,
                        recCpuPercent: true,
                        minramMb: true,
                        recRamMb: true,
                        preSelectedResourceTierId: true,
                        note: true,
                    },
                },
            },
        }),
        fetchPerformanceGroups(),
        prisma.resourceTier.findMany({
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
            select: {
                id: true,
                name: true,
                diskMB: true,
                backups: true,
                ports: true,
                priceCents: true,
                enabled: true,
            },
        }),
        prisma.location.findMany({
            where: { freeServer: true, enabled: true },
            select: { id: true },
        }),
    ]);
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; gameSlug: string }>;
}): Promise<Metadata> {
    const { locale, gameSlug } = await params;
    const copy = getMetadataCopy(locale);
    const [game] = await getGameLandingPageData(gameSlug);

    if (!game) {
        notFound();
    }

    return createPublicMetadata({
        locale,
        path: `/order/${gameSlug}`,
        title: copy.gameOrderTitle(game.name),
        description: copy.gameOrderDescription(game.name),
        keywords: [
            `${game.name} server`,
            `${game.name} hosting`,
            `${game.name} gameserver`,
            'game server hosting',
        ],
    });
}

export default async function GameLandingPage({
    params,
}: {
    params: Promise<{ locale: string; gameSlug: string }>;
}) {
    const { gameSlug } = await params;

    const [game, performanceGroups, resourceTiers, freeLocations] =
        await getGameLandingPageData(gameSlug);

    if (!game) {
        notFound();
    }

    if (!performanceGroups || performanceGroups.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No hardware options available.
            </div>
        );
    }

    return (
        <Suspense>
            <ConfiguredOrderClient
                performanceGroups={performanceGroups}
                resourceTiers={resourceTiers}
                game={game}
                hasFreeServers={freeLocations.length > 0}
                hardwareRecommendations={game.hardwareRecommendations}
            />
        </Suspense>
    );
}
