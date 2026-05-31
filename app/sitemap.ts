import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { routing } from '@/i18n/routing';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://scyed.com';

function localeUrls(
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
): MetadataRoute.Sitemap {
    return routing.locales.map((locale) => ({
        url: `${BASE_URL}/${locale}${path}`,
        priority,
        changeFrequency,
    }));
}

function gameImageUrls(gameName: string): string[] {
    const file = gameName.toLowerCase();
    return [
        `${BASE_URL}/images/light/games/icons/${file}.webp`,
        `${BASE_URL}/images/dark/games/icons/${file}.webp`,
    ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const games = await prisma.gameData.findMany({
        where: { enabled: true },
        select: { slug: true, name: true },
        orderBy: { sorting: 'asc' },
    });

    const staticOrderPages: MetadataRoute.Sitemap = [
        ...localeUrls('/order', 0.9, 'weekly'),
        ...localeUrls('/order/configure', 0.8, 'weekly'),
        ...localeUrls('/order/configure/games', 0.7, 'weekly'),
        ...localeUrls('/order/free', 0.8, 'weekly'),
    ];

    const gameOrderPages: MetadataRoute.Sitemap = games.flatMap(({ slug, name }) => {
        const images = gameImageUrls(name);
        return [
            ...localeUrls(`/order/${slug}`, 0.85, 'weekly').map((entry) => ({ ...entry, images })),
            ...localeUrls(`/order/${slug}/setup`, 0.6, 'weekly').map((entry) => ({
                ...entry,
                images,
            })),
        ];
    });

    const freeGamePages: MetadataRoute.Sitemap = games.flatMap(({ slug, name }) => {
        const images = gameImageUrls(name);
        return localeUrls(`/order/free/${slug}`, 0.7, 'weekly').map((entry) => ({
            ...entry,
            images,
        }));
    });

    return [...staticOrderPages, ...gameOrderPages, ...freeGamePages];
}
