import 'server-only';

import prisma from '@/lib/prisma';
import { activeSuspensionInclude } from '@/lib/gameserver/suspension';

import { ClientServer } from '@/models/prisma';

/** This function doesnt auth the request, should only be called from inside a server component */
export async function getUserServer(userId: string): Promise<ClientServer[]> {
    return await prisma.gameServer.findMany({
        where: {
            userId: userId,
            status: {
                not: 'DELETED',
            },
        },
        take: 100,
        include: {
            gameData: true,
            ...activeSuspensionInclude(),
        },
        orderBy: { createdAt: 'desc' },
    });
}
