'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { FAQ_SORTING_ERROR, isValidFaqSorting } from './faqRules';

export default async function createFAQ(
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

    // A FAQ without both languages or without a category would show up half-empty or nowhere
    if (
        ![question_en, question_de, answer_en, answer_de].every((text) => text.trim()) ||
        categories.length === 0
    ) {
        throw new Error('Questions, answers and at least one category are required');
    }

    const createdFAQ = await prisma.fAQ.create({
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

    logger.info('Created Faq', 'SYSTEM', { userId: session.user.id, details: { createdFAQ } });

    return createdFAQ;
}
