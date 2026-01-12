import toggleSuspendGameServer from '../suspendServer/suspendServer';
import { createPtClient } from '../ptAdminClient';
import { env } from 'next-runtime-env';
import { logger } from '@/lib/logger';
import { calcBackups, calcDiskSize } from '@/lib/GlobalFunctions/ptResourceLogic';
import prisma from '@/lib/prisma';
import { GameServerOrder } from '@/app/client/generated/browser';

export default async function upgradeFromFreeGameServer(serverOrder: GameServerOrder) {
    throw new Error('Feature not vompleted.');

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

        // set new CPU and RAM
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
                    disk: calcDiskSize(serverOrder.cpuPercent, serverOrder.ramMB),
                    io: ptServer.limits.io,
                    cpu: serverOrder.cpuPercent,
                    feature_limits: {
                        allocations: ptServer.featureLimits.allocations,
                        databases: ptServer.featureLimits.databases,
                        backups: calcBackups(serverOrder.cpuPercent, serverOrder.ramMB),
                    },
                }),
            },
        );

        if (!response.ok) {
            throw new Error('PT API Error: ' + (await response.json()));
        }
    } catch (error) {
        logger.fatal('Error upgrading from free server: ', 'FREE_SERVER_EXTEND', {
            details: { error: JSON.stringify(error) },
            gameServerId: gameServer.id,
        });
    }
}
