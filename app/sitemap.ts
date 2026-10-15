import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { routing } from '@/i18n/routing';
import { SITE_URL } from '@/lib/metadata';

// Rendered per request instead of once at build time, so new blog posts and games show up without
// a deploy. Not ISR: its cache would live per instance. Crawlers fetch it rarely, and the two
// queries are cheap.
export const dynamic = 'force-dynamic';

type SitemapEntry = MetadataRoute.Sitemap[number];

function localizedUrl(locale: string, path: string) {
    return `${SITE_URL}/${locale}${path}`;
}

/** One entry per locale, each listing all language versions (same hreflang set as the page head). */
function localeUrls(
    path: string,
    priority: number,
    changeFrequency: SitemapEntry['changeFrequency'],
    extra: Pick<SitemapEntry, 'images' | 'lastModified'> = {},
): MetadataRoute.Sitemap {
    const languages = {
        ...Object.fromEntries(
            routing.locales.map((locale) => [locale, localizedUrl(locale, path)]),
        ),
        'x-default': localizedUrl(routing.defaultLocale, path),
    };

    return routing.locales.map((locale) => ({
        url: localizedUrl(locale, path),
        priority,
        changeFrequency,
        alternates: { languages },
        ...extra,
    }));
}

function gameImageUrls(gameName: string): string[] {
    const file = gameName.toLowerCase();
    return [
        `${SITE_URL}/images/light/games/icons/${file}.webp`,
        `${SITE_URL}/images/dark/games/icons/${file}.webp`,
    ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [games, blogPosts] = await Promise.all([
        prisma.gameData.findMany({
            where: { enabled: true },
            select: { slug: true, name: true },
            orderBy: { sorting: 'asc' },
        }),
        // Same filter as the public blog list: unlisted posts stay reachable by link only.
        prisma.blogPost.findMany({
            where: { published: true, listed: true, publishedAt: { lte: new Date() } },
            select: { slug: true, updatedAt: true },
            orderBy: { publishedAt: 'desc' },
        }),
    ]);

    const staticPages: MetadataRoute.Sitemap = [
        ...localeUrls('', 1, 'weekly'),
        ...localeUrls('/pricing', 0.8, 'weekly'),
        ...localeUrls('/blog', 0.6, 'weekly'),
        ...localeUrls('/changelog', 0.5, 'weekly'),
        ...localeUrls('/support/tickets', 0.5, 'monthly'),
    ];

    const staticOrderPages: MetadataRoute.Sitemap = [
        ...localeUrls('/order', 0.9, 'weekly'),
        ...localeUrls('/order/configure', 0.8, 'weekly'),
        ...localeUrls('/order/free', 0.8, 'weekly'),
    ];

    // Funnel steps (/order/[game]/setup, /order/configure/games) are noindex and not listed.
    const gameOrderPages: MetadataRoute.Sitemap = games.flatMap(({ slug, name }) =>
        localeUrls(`/order/${slug}`, 0.85, 'weekly', { images: gameImageUrls(name) }),
    );

    const freeGamePages: MetadataRoute.Sitemap = games.flatMap(({ slug, name }) =>
        localeUrls(`/order/free/${slug}`, 0.7, 'weekly', { images: gameImageUrls(name) }),
    );

    const blogPostPages: MetadataRoute.Sitemap = blogPosts.flatMap(({ slug, updatedAt }) =>
        localeUrls(`/blog/${slug}`, 0.5, 'monthly', { lastModified: updatedAt }),
    );

    return [
        ...staticPages,
        ...staticOrderPages,
        ...gameOrderPages,
        ...freeGamePages,
        ...blogPostPages,
    ];
}
