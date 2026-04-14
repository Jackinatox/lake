'use server';

import { OrderStatus, OrderType } from '@/app/client/generated/enums';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { checkoutReturnSearchParamsSchema } from '@/lib/validation/order';
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

    const parsedSession = checkoutReturnSearchParamsSchema.parse({ session_id: stripeSession });

    const serverOrder = await prisma.gameServerOrder.findFirst({
        where: { stripeSessionId: parsedSession.session_id, userId: session.user.id },
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
