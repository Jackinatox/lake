import 'server-only';

import { prisma } from '@/prisma';
import { ClientServer } from '@/models/prisma';

/** This function doesnt auth the request, should only be called from inside a server component */
export async function getUserServer(userId: string): Promise<ClientServer[] | null> {
    return await prisma.gameServer.findMany({
        where: {
            userId: userId,
            status: {
                notIn: ['CREATION_FAILED', 'DELETED'],
            },
        },
        take: 100,
        include: {
            gameData: true,
        },
        orderBy: { expires: 'desc' },
    });
}
