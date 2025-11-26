import prisma from '@/lib/prisma';

import { env } from 'next-runtime-env';
import { createPtClient } from '../ptAdminClient';
import { logger } from '@/lib/logger';
import toggleSuspendGameServer from '../suspendServer/suspendServer';
import { calcBackups, calcDiskSize } from '@/lib/GlobalFunctions/ptResourceLogic';
import { GameServerOrder } from '@/app/client/generated/browser';

/**
 * Upgrades a game server's resources (CPU and RAM) based on a server order.
 *
 * @remarks
 * This function does not perform user authentication. Ensure proper authentication
 * is handled before calling this function.
 */
export default async function upgradeGameServer(serverOrder: GameServerOrder) {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptApiKey = env('PTERODACTYL_API_KEY');
    const gameServer = await prisma.gameServer.findUniqueOrThrow({
        where: { id: serverOrder.gameServerId || '', ptAdminId: { not: null } },
        include: { user: true },
    });
    const pt = createPtClient();

    const ptServer = await pt.getServer(gameServer.ptAdminId!.toString()); // ! is ok because its checked in the query above

    try {
        await toggleSuspendGameServer(gameServer.id, 'unsuspend');
        const diskMb = calcDiskSize(serverOrder.cpuPercent, serverOrder.ramMB);
        const backups = calcBackups(serverOrder.cpuPercent, serverOrder.ramMB);

        const response = await fetch(
            `${panelUrl}/api/application/servers/${gameServer.ptAdminId}/build`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    allocation: ptServer.allocation,
                    memory: serverOrder.ramMB,
                    swap: ptServer.limits.swap,
                    disk: diskMb,
                    io: ptServer.limits.io,
                    cpu: serverOrder.cpuPercent,
                    feature_limits: {
                        allocations: ptServer.featureLimits.allocations,
                        databases: ptServer.featureLimits.databases,
                        backups: backups,
                    },
                }),
            },
        );

        if (!response.ok) {
            throw new Error('PT API Error: ' + (await response.json()));
        }
        await prisma.gameServer.update({
            where: { id: gameServer.id },
            data: {
                cpuPercent: serverOrder.cpuPercent,
                ramMB: serverOrder.ramMB,
                diskMB: diskMb,
                backupCount: backups,
                expires: serverOrder.expiresAt,
                status: 'ACTIVE',
            },
        });
    } catch (error) {
        logger.fatal('Error upgrading game server', 'GAME_SERVER', {
            details: { error, gameServerId: gameServer.id },
            gameServerId: gameServer.id,
            userId: gameServer.userId,
        });
        throw new Error('Failed to upgrade game server');
    }
}
