import { fetchGameBySlug, fetchPerformanceGroups } from '@/lib/actions';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import SetupPageClient from './SetupPageClient';

export default async function SetupPage({ params }: { params: Promise<{ gameSlug: string }> }) {
    const { gameSlug } = await params;

    const [game, performanceGroups, resourceTiers] = await Promise.all([
        fetchGameBySlug(gameSlug),
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
    ]);

    if (!game) {
        notFound();
    }

    return (
        <Suspense>
            <SetupPageClient
                game={game}
                gameSlug={gameSlug}
                performanceGroups={performanceGroups}
                resourceTiers={resourceTiers}
            />
        </Suspense>
    );
}
