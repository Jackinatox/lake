'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

import { headers } from 'next/headers';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { logger } from '@/lib/logger';
import { FREE_TIER_EXTEND_COOLDOWN_HOURS } from '@/app/GlobalConstants';
import toggleSuspendGameServer from '@/lib/Pterodactyl/suspendServer/suspendServer';
import { refuseIfSuspended, SERVER_SUSPENDED_MESSAGE } from '@/lib/gameserver/requireUnsuspended';
import { GameServer } from '@/app/client/generated/browser';

export async function extendFreeServer(
    serverId: string,
): Promise<{ success: boolean; newExpiry?: Date; error?: string; canExtendAt?: Date }> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            logger.warn('Unauthenticated free server extension attempt', 'AUTHENTICATION', {
                details: { serverId },
            });
            return { success: false, error: 'Not authenticated' };
        }

        const server = await prisma.gameServer.findFirst({
            where: {
                ptServerId: serverId,
                userId: session.user.id,
                type: 'FREE',
                status: {
                    notIn: ['DELETED', 'CREATION_FAILED'],
                },
            },
        });

        if (!server) {
            logger.error('Free server extension failed - server not found', 'FREE_SERVER_EXTEND', {
                details: { serverId },
                userId: session.user.id,
            });
            return { success: false, error: 'Server not found or not eligible for free extension' };
        }

        // Refuse before the cooldown is consumed: extending a quarantined server buys days the
        // user cannot use, and the unsuspend below would be refused anyway.
        if (await refuseIfSuspended(server.id, 'extendFreeServer', session.user.id)) {
            return { success: false, error: SERVER_SUSPENDED_MESSAGE };
        }

        // Check cooldown period
        const now = new Date();
        if (server.lastExtended) {
            const cooldownMs = FREE_TIER_EXTEND_COOLDOWN_HOURS * 60 * 60 * 1000;
            const timeSinceLastExtend = now.getTime() - server.lastExtended.getTime();

            if (timeSinceLastExtend < cooldownMs) {
                const canExtendAt = new Date(server.lastExtended.getTime() + cooldownMs);
                const hoursRemaining = Math.ceil(
                    (cooldownMs - timeSinceLastExtend) / (1000 * 60 * 60),
                );

                logger.info('Free server extension blocked - cooldown active', 'GAME_SERVER', {
                    details: {
                        lastExtended: server.lastExtended,
                        canExtendAt,
                        hoursRemaining,
                    },
                    userId: session.user.id,
                    gameServerId: server.id,
                });

                return {
                    success: false,
                    error: `Please wait ${hoursRemaining} more hour(s) before extending again`,
                    canExtendAt,
                };
            }
        }

        if (!(await resumeIfSuspended(server))) {
            return {
                success: false,
                error: 'Server could not be resumed, please contact support',
            };
        }

        const freeConfig = await getFreeTierConfigCached();
        const newExpiry = new Date(now.getTime() + freeConfig.duration * 24 * 60 * 60 * 1000);

        const updatedServer = await prisma.gameServer.update({
            where: { id: server.id },
            data: {
                expires: newExpiry,
                lastExtended: now,
                status: 'ACTIVE',
            },
        });

        logger.info('Free server extended successfully', 'FREE_SERVER_EXTEND', {
            details: {
                serverName: server.name,
                oldExpiry: server.expires,
                newExpiry: newExpiry,
                daysAdded: freeConfig.duration,
                lastExtended: server.lastExtended,
                currentExtension: now,
            },
            userId: session.user.id,
            gameServerId: server.id,
        });

        return { success: true, newExpiry: updatedServer.expires };
    } catch (error) {
        logger.error('Failed to extend free server', 'FREE_SERVER_EXTEND', {
            details: {
                serverId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            },
        });
        return { success: false, error: 'Internal error occurred while extending server' };
    }
}

/**
 * Lifts the expiry suspension so the extended server actually runs again.
 *
 * Returns false when Pterodactyl still has the server frozen, so the caller can stop rather
 * than write `ACTIVE` and a new expiry over a server the user cannot reach.
 */
async function resumeIfSuspended(server: GameServer): Promise<boolean> {
    if (server.status !== 'EXPIRED') return true;

    const result = await toggleSuspendGameServer(server.id, 'unsuspend');
    return Boolean(result?.success);
}
