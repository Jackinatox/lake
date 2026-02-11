import { fetchGameBySlug, fetchPerformanceGroups } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import SetupPageClient from './SetupPageClient';

export default async function SetupPage({ params }: { params: Promise<{ gameSlug: string }> }) {
    const { gameSlug } = await params;

    const [game, performanceGroups] = await Promise.all([
        fetchGameBySlug(gameSlug),
        fetchPerformanceGroups(),
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
            />
        </Suspense>
    );
}
