import 'server-only'

import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { ServerOrder } from '@prisma/client';
import { ClientServer } from '@/models/prisma';

export async function getUserServer(): Promise<ClientServer[] | null> {
    const session = await auth();

    
    if (!session?.user) {
        return null;    //TODO: or redirect to login
    }
    // console.log(session?.user)
    // await new Promise((resolve) => setTimeout(resolve, 5000))
    return await prisma.serverOrder.findMany({
        where: {
            userId: session.user.id,
            status: {
                notIn: ['FAILED', 'PENDING']
            }
        },
        include: {
            gameData: true
        }
    });
}