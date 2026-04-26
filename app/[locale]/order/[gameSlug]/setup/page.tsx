import { fetchGameBySlug, fetchPerformanceGroups } from '@/lib/actions';
import {
    buildHardwareMetadataSummary,
    createPublicMetadata,
    getMetadataCopy,
} from '@/lib/metadata';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';
import SetupPageClient from './SetupPageClient';

const getSetupPageData = cache(async (gameSlug: string) => {
    return Promise.all([
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
});

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; gameSlug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
    const [{ locale, gameSlug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
    const copy = getMetadataCopy(locale);
    const [game] = await getSetupPageData(gameSlug);

    if (!game) {
        notFound();
    }

    const summary = buildHardwareMetadataSummary(resolvedSearchParams, locale);

    return createPublicMetadata({
        locale,
        path: `/order/${gameSlug}/setup`,
        title: copy.gameSetupTitle(game.name, summary ?? undefined),
        description: copy.gameSetupDescription(game.name),
        keywords: [`${game.name} setup`, `${game.name} server config`, `${game.name} hosting`],
    });
}

export default async function SetupPage({
    params,
}: {
    params: Promise<{ locale: string; gameSlug: string }>;
}) {
    const { gameSlug } = await params;

    const [game, performanceGroups, resourceTiers] = await getSetupPageData(gameSlug);

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
