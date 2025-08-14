import 'server-only'

import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { ClientServer } from '@/models/prisma';

export async function getUserServer(): Promise<ClientServer[] | null> {
    const session = await auth();

    
    if (!session?.user) {
        return null;
    }
    // console.log(session?.user)
    // await new Promise((resolve) => setTimeout(resolve, 5000))
    return await prisma.gameServer.findMany({
        where: {
            userId: session.user.id,
            status: {
                notIn: ['CREATION_FAILED']
            }
        },
        include: {
            gameData: true
        }
    });
}