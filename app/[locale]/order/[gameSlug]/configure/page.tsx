import { notFound } from 'next/navigation';

// Route disabled — unified configurator at /order/[gameSlug] replaces this flow
export default function ConfigurePage() {
    notFound();
}

/*
// ── Original implementation (preserved for re-enablement) ──────────────
import { Suspense } from 'react';
import { fetchPerformanceGroups } from '@/lib/actions';
import prisma from '@/lib/prisma';
import ConfigurePageClient from './ConfigurePageClient';

export default async function ConfigurePage({
    params,
}: {
    params: Promise<{ gameSlug: string }>;
}) {
    const { gameSlug } = await params;

    const [performanceGroups, game] = await Promise.all([
        fetchPerformanceGroups(),
        prisma.gameData.findUnique({
            where: { slug: gameSlug, enabled: true },
            select: { id: true, name: true, slug: true },
        }),
    ]);

    if (!game) {
        notFound();
    }

    if (!performanceGroups || performanceGroups.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No hardware options available.</div>;
    }

    return (
        <Suspense>
            <ConfigurePageClient
                performanceGroups={performanceGroups}
                game={game}
            />
        </Suspense>
    );
}
*/
