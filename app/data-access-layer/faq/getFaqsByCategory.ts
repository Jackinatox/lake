import 'server-only';

import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export type FaqItem = {
    id: number;
    question: string;
    answer: string;
};

/**
 * Fetches enabled FAQs that belong to at least one of the given categories,
 * resolved to the requested locale and ordered by their `sorting` field.
 *
 * Results are cached across requests (revalidated periodically and on the `faq`
 * tag) since FAQ content changes rarely.
 */
export async function getFaqsByCategory(
    categories: string[],
    locale: string,
): Promise<FaqItem[]> {
    if (categories.length === 0) return [];

    const cached = unstable_cache(
        async (categories: string[], locale: string): Promise<FaqItem[]> => {
            const faqs = await prisma.fAQ.findMany({
                where: {
                    enabled: true,
                    category: { hasSome: categories },
                },
                orderBy: { sorting: 'asc' },
                select: {
                    id: true,
                    question_de: true,
                    question_en: true,
                    answer_de: true,
                    answer_en: true,
                },
            });

            const isDe = locale === 'de';
            return faqs.map((faq) => ({
                id: faq.id,
                question: isDe ? faq.question_de : faq.question_en,
                answer: isDe ? faq.answer_de : faq.answer_en,
            }));
        },
        ['faq-by-category'],
        { revalidate: 300, tags: ['faq'] },
    );

    return cached(categories, locale);
}
