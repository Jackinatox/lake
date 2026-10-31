import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import React from 'react';
import FAQEditor from './FAQEditor';

// Categories a FaqSection renders: /pricing, /withdrawal, /order/free, plus `game_<slug>` on every
// game's order page (components/order/GameDetails.tsx). Offered even before the first entry uses them.
const PAGE_CATEGORIES = ['pricing', 'refunds', 'free_servers'];

export default async function FAQPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') return <NoAdmin />;

    const [used, games, faqs] = await Promise.all([
        prisma.$queryRaw<{ unnest: string }[]>`
            SELECT DISTINCT unnest("FAQ".category) FROM "FAQ"
        `,
        prisma.gameData.findMany({ select: { slug: true } }),
        prisma.fAQ.findMany(),
    ]);

    const categories = [
        ...new Set([
            ...PAGE_CATEGORIES,
            ...games.map((game) => `game_${game.slug}`),
            ...used.map((r) => r.unnest),
        ]),
    ].sort();

    return (
        <div>
            <FAQEditor faqs={faqs} categories={categories} />
        </div>
    );
}
