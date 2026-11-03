import { fetchPerformanceGroups } from '@/lib/actions';
import {
    buildHardwareMetadataSummary,
    createPublicMetadata,
    getMetadataCopy,
} from '@/lib/metadata';
import prisma from '@/lib/prisma';
import ConfigureHardwareClient from './ConfigureHardwareClient';
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
        path: '/order/configure',
        title: copy.orderConfigureTitle(summary ?? undefined),
        description: copy.orderConfigureDescription,
        keywords: ['server hardware', 'configure server', 'cpu ram storage', 'game server setup'],
        // Same hardware-first configurator as /pricing, which is the page that should rank for
        // prices; this one is the funnel step its "back" link returns to. Links are still followed.
        noindex: true,
    });
}

export default async function ConfigureHardwarePage() {
    const [performanceGroups, resourceTiers] = await Promise.all([
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

    if (!performanceGroups || performanceGroups.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No hardware options available.
            </div>
        );
    }

    // No <Suspense> around the client: it would stream the whole page into a hidden <div> at the
    // end of the HTML, which crawlers that do not run JS read poorly. Every route renders
    // dynamically (root layout reads the locale from the request), so useSearchParams needs none.
    return (
        <ConfigureHardwareClient
            performanceGroups={performanceGroups}
            resourceTiers={resourceTiers}
        />
    );
}
