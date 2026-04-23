import 'server-only';

import prisma from '@/lib/prisma';

import { UpgradeBaseConfig } from '@/models/config';

// Helper funcion that fetches the current hardware conf of a gameserver - used to calc upgrade prioce or show current hardware
export async function getGameServerConfig(
    server_id: string,
    userId: string,
): Promise<UpgradeBaseConfig | null> {
    const server = await prisma.gameServer.findFirst({
        where: {
            userId: userId,
            ptServerId: server_id,
            status: {
                notIn: ['DELETED'],
            },
        },
        include: {
            gameData: true,
            resourceTier: {
                select: {
                    id: true,
                    name: true,
                    diskMB: true,
                    backups: true,
                    ports: true,
                    priceCents: true,
                    enabled: true,
                },
            },
        },
    });

    if (!server) return null;

    const now = new Date();
    const expires = server.expires as Date;
    const diffMs = expires.getTime() - now.getTime();
    const durationsDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
        cpuPercent: server.cpuPercent,
        ramMb: server.ramMB,
        diskMb: server.diskMB,
        backupCount: server.backupCount,
        allocations: server.allocations,
        durationsDays,
        pfGroupId: server.locationId,
        resourceTierId: server.resourceTierId,
        currentDiskUsageMb: 0,
        resourceTier: server.resourceTier,
    };
}
