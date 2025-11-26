'use server';

import { auth } from '@/auth';
import { env } from 'next-runtime-env';
import prisma from '@/lib/prisma';

import { GameServerStatus } from '@/types/gameData';
import { headers } from 'next/headers';

export default async function checkIfServerReady(
    stripeSession: string,
): Promise<{ status: GameServerStatus; serverId?: string | null }> {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error('User not authenticated');
    }

    // -------------------------

    const serverOrder = await prisma.gameServerOrder.findFirst({
        where: { stripeSessionId: stripeSession },
        include: { gameServer: true },
    });

    if (!serverOrder) {
        return { status: GameServerStatus.DOES_NOT_EXIST, serverId: null };
    }

    // Map order status first
    if (serverOrder.status === 'PENDING') {
        return { status: GameServerStatus.PAYMENT_PROCESSING };
    }
    if (serverOrder.status === 'PAYMENT_FAILED') {
        return { status: GameServerStatus.PAYMENT_FAILED };
    }

    if (serverOrder.status === 'PAID') {
        const gs = serverOrder.gameServer;
        if (!gs) {
            return { status: GameServerStatus.PROVISIONING };
        }

        // Handle terminal server statuses early
        if (gs.status === 'CREATION_FAILED') {
            return { status: GameServerStatus.CREATION_FAILED };
        }
        if (gs.status === 'EXPIRED' && serverOrder.type !== 'UPGRADE') {
            return { status: GameServerStatus.EXPIRED };
        }
        if (gs.status === 'DELETED') {
            return { status: GameServerStatus.DELETED };
        }

        // If we have a panel server id, check if installation finished
        if (gs.ptServerId) {
            try {
                const res = await fetch(`${panelUrl}/api/client/servers/${gs.ptServerId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${session.user.ptKey}`,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    next: { revalidate: 0 },
                });

                if (res.ok) {
                    const data = await res.json();
                    const isInstalling = data.attributes.is_installing;
                    if (isInstalling === false) {
                        if (gs.status !== 'ACTIVE') {
                            await prisma.gameServer.update({
                                where: { id: gs.id },
                                data: { status: 'ACTIVE' },
                            });
                        }
                        return { status: GameServerStatus.ACTIVE, serverId: gs.ptServerId };
                    }
                    return { status: GameServerStatus.PROVISIONING };
                }

                console.error(`Pterodactyl API error: ${res.status} ${await res.text()}`);
                return { status: GameServerStatus.CREATION_FAILED };
            } catch (error) {
                console.error('Failed to fetch server status:', error);
                return { status: GameServerStatus.CREATION_FAILED };
            }
        }

        // No panel id yet -> still provisioning
        return { status: GameServerStatus.PROVISIONING };
    }

    // Default fallback: assume provisioning until other states are reported
    return { status: GameServerStatus.PROVISIONING };
}
