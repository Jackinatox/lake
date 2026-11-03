'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import {
    FAQ_CONTENT_ERROR,
    FAQ_SORTING_ERROR,
    hasRequiredFaqContent,
    isValidFaqSorting,
} from './faqRules';

export default async function editFAQ(
    id: number,
    question_en: string,
    question_de: string,
    answer_en: string,
    answer_de: string,
    enabled: boolean,
    categories: string[],
    sorting: number,
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Unauthorized');

    if (!isValidFaqSorting(sorting)) throw new Error(FAQ_SORTING_ERROR);
    if (!hasRequiredFaqContent([question_en, question_de, answer_en, answer_de], categories)) {
        throw new Error(FAQ_CONTENT_ERROR);
    }

    const updatedFAQ = await prisma.fAQ.update({
        where: { id },
        data: {
            question_en,
            question_de,
            answer_en,
            answer_de,
            enabled,
            category: categories,
            sorting,
        },
    });

    revalidateTag('faq', 'max');

    logger.info('Updated Faq', 'SYSTEM', { userId: session.user.id, details: { updatedFAQ } });

    return updatedFAQ;
}
