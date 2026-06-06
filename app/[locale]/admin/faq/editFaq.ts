'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

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
