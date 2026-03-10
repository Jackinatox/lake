import prisma from '@/lib/prisma';

import { env } from 'next-runtime-env';
import { logger } from '@/lib/logger';

/**
 * Suspends or unsuspends a gameserver in Pterodactyl
 * This function doesn't auth the user, make sure to do that before calling this function
 * @param gameServerId - The ID of the gameserver to suspend/unsuspend
 * @param action - Either 'suspend' or 'unsuspend'
 */
export default async function toggleSuspendGameServer(
    gameServerId: string,
    action: 'suspend' | 'unsuspend',
) {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptApiKey = env('PTERODACTYL_API_KEY');

    const gameServer = await prisma.gameServer.findUniqueOrThrow({
        where: { id: gameServerId, ptAdminId: { not: null } },
        include: { user: true },
    });

    try {
        const response = await fetch(
            `${panelUrl}/api/application/servers/${gameServer.ptAdminId}/${action}`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            logger.error(`PT API Error: Failed to ${action} server`, 'GAME_SERVER', {
                userId: gameServer.userId,
                gameServerId: gameServer.id,
                details: { ...errorData, ptAdminId: gameServer.ptAdminId, ptServerId: gameServer.ptServerId, action },
            });
            throw new Error('PT API Error: ' + JSON.stringify(errorData));
        }

        await prisma.gameServer.update({
            where: { id: gameServer.id },
            data: {
                status: action === 'suspend' ? 'EXPIRED' : 'ACTIVE',
            },
        });

        logger.info(`Gameserver ${action}ed successfully`, 'GAME_SERVER', {
            gameServerId: gameServer.id,
            userId: gameServer.userId,
            details: { ptAdminId: gameServer.ptAdminId, ptServerId: gameServer.ptServerId, action },
        });

        return { success: true, gameServerId: gameServer.id, action };
    } catch (error) {
        logger.fatal(`Error ${action}ing gameserver`, 'GAME_SERVER', {
            details: { error, gameServerId: gameServer.id, ptAdminId: gameServer.ptAdminId, ptServerId: gameServer.ptServerId, action },
            gameServerId: gameServer.id,
            userId: gameServer.userId,
        });
    }
}
