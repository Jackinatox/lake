'use server';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/prisma';
import { auth } from '@/auth';
import { headers } from 'next/headers';

export async function expireSessions(sessionIds: string[]) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        throw new Error('Not authorized');
    }

    const expired: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of sessionIds) {
        try {
            await stripe.checkout.sessions.expire(id);
            // Also reflect in DB if the order exists
            await prisma.gameServerOrder
                .update({ where: { stripeSessionId: id }, data: { status: 'EXPIRED' } })
                .catch(() => {});
            expired.push(id);
        } catch (e: any) {
            failed.push({ id, error: e?.message ?? 'unknown error' });
        }
    }

    return { expired, failed };
}

export async function deleteOrders(sessionIds: string[]) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        throw new Error('Not authorized');
    }

    // Find orders by stripeSessionId
    const orders = await prisma.gameServerOrder.findMany({
        where: { stripeSessionId: { in: sessionIds } },
    });
    const foundIds = new Set(orders.map((o) => o.stripeSessionId).filter(Boolean) as string[]);

    const del = await prisma.gameServerOrder.deleteMany({
        where: { stripeSessionId: { in: Array.from(foundIds) } },
    });

    return {
        deleted: del.count,
        notFound: sessionIds.filter((id) => !foundIds.has(id)).length,
    };
}
