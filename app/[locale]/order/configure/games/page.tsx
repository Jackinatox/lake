import prisma from '@/lib/prisma';
import { fetchPerformanceGroups } from '@/lib/actions';
import {
    buildHardwareMetadataSummary,
    createPublicMetadata,
    getMetadataCopy,
} from '@/lib/metadata';
import { Suspense } from 'react';
import GamesAfterHardwareClient from './GamesAfterHardwareClient';
import type { Metadata } from 'next';

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
    const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);
    const copy = getMetadataCopy(locale);
    const summary = buildHardwareMetadataSummary(resolvedSearchParams, locale);

    return createPublicMetadata({
        locale,
        path: '/order/configure/games',
        title: copy.orderConfigureGamesTitle(summary ?? undefined),
        description: copy.orderConfigureGamesDescription,
        keywords: ['choose game server', 'game selection', 'configured server'],
    });
}

export default async function GamesAfterHardwarePage() {
    const [games, resourceTiers, performanceGroups] = await Promise.all([
        prisma.gameData.findMany({
            select: { id: true, name: true, slug: true },
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
        }),
        prisma.resourceTier.findMany({
            where: { enabled: true },
            orderBy: { sorting: 'asc' },
        }),
        fetchPerformanceGroups(),
    ]);

    const gameCards = games.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;
        return {
            ...game,
            imageSrc: `/images/games/icons/${imgName}`,
        };
    });

    return (
        <Suspense>
            <GamesAfterHardwareClient
                games={gameCards}
                resourceTiers={resourceTiers}
                performanceGroups={performanceGroups ?? []}
            />
        </Suspense>
    );
}
