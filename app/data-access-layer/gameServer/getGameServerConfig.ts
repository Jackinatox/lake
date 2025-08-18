import 'server-only'

import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { ClientServer } from '@/models/prisma';
import { HardwareConfig } from '@/models/config';

export async function getGameServerConfig(server_id: string): Promise<HardwareConfig | null> {
    const session = await auth();

    
    if (!session?.user) {
        return null;
    }
    // console.log(session?.user)
    // await new Promise((resolve) => setTimeout(resolve, 5000))
    const server = await prisma.gameServer.findFirst({
        where: {
            userId: session.user.id,
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


    return {
        cpuPercent: server.cpuPercent,
        ramMb: server.ramMB,
        diskMb: server.diskMB,
        durationsDays: 0,
        pfGroupId: server.locationId
        // TODO: Check if this needs ptId or dbId
    } satisfies HardwareConfig;
}