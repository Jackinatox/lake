'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { env } from 'next-runtime-env';
import { headers } from 'next/headers';

export async function reassignPortsAction(
    ptServerId: string,
): Promise<{ success: boolean; message?: string }> {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        logger.warn('Unauthorized reassignPorts attempt', 'GAME_SERVER');
        return { success: false, message: 'Not authenticated' };
    }

    const server = await prisma.gameServer.findFirst({
        where: { ptServerId, userId: session.user.id },
    });

    if (!server) {
        logger.warn('reassignPorts: server not found or wrong user', 'GAME_SERVER', {
            userId: session.user.id,
            details: { ptServerId },
        });
        return { success: false, message: 'Server not found' };
    }

    const workerUrl = env('WORKER_IP');

    logger.info(`Reassigning ports for server ${ptServerId}`, 'GAME_SERVER', {
        userId: session.user.id,
        details: { ptServerId },
    });

    try {
        const response = await fetch(`${workerUrl}/v1/ports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ptServerId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('Worker returned error during port reassignment', 'GAME_SERVER', {
                userId: session.user.id,
                details: { ptServerId, status: response.status, error: errorText },
            });
            return { success: false, message: errorText || `Worker error: ${response.status}` };
        }

        logger.info(`Ports reassigned successfully for server ${ptServerId}`, 'GAME_SERVER', {
            userId: session.user.id,
            details: { ptServerId },
        });

        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Network error during port reassignment', 'GAME_SERVER', {
            userId: session.user.id,
            details: { ptServerId, error: message },
        });
        return { success: false, message };
    }
}
