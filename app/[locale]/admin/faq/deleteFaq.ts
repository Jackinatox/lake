'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

export default async function deleteFAQ(id: number) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Unauthorized');

    const deletedFAQ = await prisma.fAQ.delete({ where: { id } });

    revalidateTag('faq', 'max');

    logger.info('Deleted Faq', 'SYSTEM', { userId: session.user.id, details: { deletedFAQ } });

    return deletedFAQ;
}
