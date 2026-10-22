import { fetchPerformanceGroups } from '@/lib/actions';
import prisma from '@/lib/prisma';
import PricingClient from '@/components/pricing/PricingClient';
import { FaqSection } from '@/components/faq/FaqSection';
import { createPublicMetadata } from '@/lib/metadata';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'pricing.meta' });

    return createPublicMetadata({
        locale,
        path: '/pricing',
        title: t('title'),
        description: t('description'),
        keywords: [
            'pricing',
            'game server pricing',
            'gameserver hosting price',
            'cpu ram pricing',
            'resource packages',
        ],
    });
}

export default async function PricingPage() {
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

    // No <Suspense> around the client: it would stream the whole page into a hidden <div> at the
    // end of the HTML, which crawlers that do not run JS read poorly. Every route renders
    // dynamically (root layout reads the locale from the request), so useSearchParams needs none.
    return (
        <PricingClient
            performanceGroups={performanceGroups}
            resourceTiers={resourceTiers}
            faqSlot={<FaqSection categories={['pricing']} />}
        />
    );
}
