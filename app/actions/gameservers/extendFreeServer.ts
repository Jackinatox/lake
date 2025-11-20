'use server';

import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { headers } from 'next/headers';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { logger } from '@/lib/logger';

export async function extendFreeServer(serverId: string): Promise<{ success: boolean; newExpiry?: Date; error?: string }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        const server = await prisma.gameServer.findFirst({
            where: {
                ptServerId: serverId,
                userId: session.user.id,
                freeServer: true,
                status: {
                    notIn: ['DELETED', 'CREATION_FAILED'],
                },
            },
        });

        if (!server) {
            return { success: false, error: 'Server not found or not eligible for free extension' };
        }

        const freeConfig = await getFreeTierConfigCached();
        const daysRemaining = Math.max(
            0,
            Math.ceil((server.expires.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        );

        // Check if user can extend (must have less than 30 days remaining)
        const maxExtendDays = 30;
        if (daysRemaining >= maxExtendDays) {
            return { 
                success: false, 
                error: `You can only extend when less than ${maxExtendDays} days remain. Current days: ${daysRemaining}` 
            };
        }

        // Calculate new expiry date: max(current expiry, now) + free tier duration
        const baseDate = Math.max(server.expires.getTime(), new Date().getTime());
        const newExpiry = new Date(baseDate + freeConfig.duration * 24 * 60 * 60 * 1000);

        // Update the server
        const updatedServer = await prisma.gameServer.update({
            where: { id: server.id },
            data: {
                expires: newExpiry,
            },
        });

        logger.info('Free server extended', 'GAME_SERVER', {
            details: {
                serverId: server.id,
                oldExpiry: server.expires,
                newExpiry: newExpiry,
                daysAdded: freeConfig.duration,
            },
            userId: session.user.id,
            gameServerId: server.id,
        });

        return { success: true, newExpiry: updatedServer.expires };
    } catch (error) {
        logger.error('Failed to extend free server', 'GAME_SERVER', {
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return { success: false, error: 'Internal error occurred while extending server' };
    }
}
