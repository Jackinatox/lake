import 'server-only';

import prisma from '@/lib/prisma';
import { activeSuspensionSubSelect } from '@/lib/gameserver/suspension';
import { cache } from 'react';

export const getOwnedGameServerSummary = cache(async (userId: string, serverId: string) => {
    return prisma.gameServer.findFirst({
        where: {
            ptServerId: serverId,
            userId,
        },
        select: {
            id: true,
            ptServerId: true,
            ptAdminId: true,
            status: true,
            gameDataId: true,
            type: true,
            expires: true,
            gameConfig: true,
            locationId: true,
            name: true,
            gameData: {
                select: {
                    name: true,
                    slug: true,
                    nestId: true,
                },
            },
            suspensions: activeSuspensionSubSelect(),
        },
    });
});
