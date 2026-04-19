import prisma from '@/lib/prisma';
import { fetchPerformanceGroups } from '@/lib/actions';
import { Suspense } from 'react';
import GamesAfterHardwareClient from './GamesAfterHardwareClient';

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
