import prisma from '@/lib/prisma';
import { fetchPerformanceGroups } from '@/lib/actions';
import { notFound } from 'next/navigation';
import ConfiguredOrderClient from './ConfiguredOrderClient';
import { Suspense } from 'react';

// Old imports — kept so the file is easy to restore
// import GameLandingClient from './GameLandingClient';
// import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';

export default async function GameLandingPage({
    params,
}: {
    params: Promise<{ gameSlug: string }>;
}) {
    const { gameSlug } = await params;

    const [game, performanceGroups, resourceTiers] = await Promise.all([
        prisma.gameData.findUnique({
            where: { slug: gameSlug, enabled: true },
            select: { id: true, name: true, slug: true },
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
            },
        }),
    ]);

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
            />
        </Suspense>
    );
}
