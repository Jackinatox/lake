import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ orderId: string }> },
) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    const parsedId = Number.parseInt(orderId, 10);

    if (Number.isNaN(parsedId)) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    try {
        const order = await prisma.gameServerOrder.findUnique({
            where: {
                id: parsedId,
                userId: session.user.id, // Security: only fetch user's own orders
            },
            select: {
                gameConfig: true,
                expiresAt: true,
                createdAt: true,
                ramMB: true,
                cpuPercent: true,
                diskMB: true,
                backupCount: true,
                creationLocationId: true,
                type: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
