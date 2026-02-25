'use server';

import { OrderStatus, OrderType } from '@/app/client/generated/enums';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export default async function checkPaymentStatus(stripeSession: string): Promise<{
    orderStatus: OrderStatus;
    workerJobId?: string | null;
    hasError: boolean;
    type: OrderType;
    ptServerId: string | null;
}> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error('User not authenticated');
    }

    const serverOrder = await prisma.gameServerOrder.findFirst({
        where: { stripeSessionId: stripeSession },
        select: {
            status: true,
            workerJobId: true,
            errorText: true,
            type: true,
            gameServer: {
                select: {
                    ptServerId: true,
                },
            },
        },
    });

    if (!serverOrder) {
        throw new Error('Order not found');
    }

    return {
        orderStatus: serverOrder.status,
        workerJobId: serverOrder.workerJobId,
        hasError: serverOrder.errorText !== null,
        type: serverOrder.type,
        ptServerId: serverOrder.gameServer?.ptServerId || null,
    };
}
