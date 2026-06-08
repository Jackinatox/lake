import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import React from 'react';
import FAQEditor from './FAQEditor';

export default async function FAQPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') return <NoAdmin />;

    const test = await prisma.$queryRaw<{ unnest: string }[]>`
        SELECT DISTINCT unnest("FAQ".category) FROM "FAQ"
    `;

    const categories = test.map((r) => r.unnest);


    const faqs = await prisma.fAQ.findMany();


    return <div><FAQEditor faqs={faqs} categories={categories} /></div>;
}
