import prisma from '@/lib/prisma';

import { GameServerOrder } from '@/app/client/generated/browser';
import { logger } from '@/lib/logger';
import { createPtClient } from '../ptAdminClient';
import toggleSuspendGameServer from '../suspendServer/suspendServer';

/**
 * Upgrades a gameserver's resources (CPU and RAM) based on a server order.
 *
 * @remarks
 * This function does not perform user authentication. Ensure proper authentication
 * is handled before calling this function.
 */
export default async function upgradeGameServer(serverOrder: GameServerOrder) {
    const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
    const ptApiKey = process.env.PTERODACTYL_API_KEY;
    const gameServer = await prisma.gameServer.findUniqueOrThrow({
        where: { id: serverOrder.gameServerId || '', ptAdminId: { not: null } },
        include: { user: true },
    });
    const pt = createPtClient();

    const ptServer = await pt.getServer(gameServer.ptAdminId!.toString()); // ! is ok because its checked in the query above

    try {
        const resumed = await toggleSuspendGameServer(gameServer.id, 'unsuspend');

        // The unsuspend guard refuses while the server is under an admin suspension, which is
        // correct — but the order is paid, so the upgrade is still recorded below. The status
        // goes to ACTIVE so that lifting the suspension later releases the server for real;
        // until then it stays frozen in PT. Loud, because someone has to decide whether the
        // user gets those days back.
        if (resumed?.suspensionBlocked) {
            logger.error('Upgraded a server that stays suspended', 'GAME_SERVER', {
                gameServerId: gameServer.id,
                userId: gameServer.userId,
                details: { orderId: serverOrder.id, expiresAt: serverOrder.expiresAt },
            });
        }

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
                    disk: serverOrder.diskMB,
                    io: ptServer.limits.io,
                    cpu: serverOrder.cpuPercent,
                    feature_limits: {
                        allocations: serverOrder.allocations,
                        databases: ptServer.featureLimits.databases,
                        backups: serverOrder.backupCount,
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
                diskMB: serverOrder.diskMB,
                backupCount: serverOrder.backupCount,
                allocations: serverOrder.allocations,
                resourceTierId: serverOrder.resourceTierId,
                expires: serverOrder.expiresAt,
                status: 'ACTIVE',
                lastExtended: new Date(),
            },
        });
    } catch (error) {
        logger.fatal('Error upgrading gameserver', 'GAME_SERVER', {
            details: {
                error,
                gameServerId: gameServer.id,
                ptAdminId: gameServer.ptAdminId,
                ptServerId: gameServer.ptServerId,
            },
            gameServerId: gameServer.id,
            userId: gameServer.userId,
        });
        throw new Error('Failed to upgrade gameserver');
    } finally {
        await prisma.gameServerOrder.update({
            where: { id: serverOrder.id },
            data: {
                status: 'PAID',
            },
        });
    }
}
