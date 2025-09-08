import 'server-only'

import { prisma } from '@/prisma';
import { HardwareConfig } from '@/models/config';

export async function getGameServerConfig(server_id, userId: string): Promise<HardwareConfig | null> {
    const server = await prisma.gameServer.findFirst({
        where: {
            userId: userId,
            ptServerId: server_id,
            status: {
                notIn: ['CREATION_FAILED', 'DELETED']
            }
        },
        include: {
            gameData: true
        }
    });

    if (!server) return null;


    const now = new Date();
    const expires = server.expires as Date;
    const diffMs = expires.getTime() - now.getTime();
    const durationsDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
        cpuPercent: server.cpuPercent,
        ramMb: server.ramMB,
        diskMb: server.diskMB,
        durationsDays,
        pfGroupId: server.locationId
        // TODO: Check if this needs ptId or dbId
    } satisfies HardwareConfig;
}