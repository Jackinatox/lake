'use server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import deleteServerAdmin from '@/lib/Pterodactyl/Functions/DeleteServerAdmin';
import toggleSuspendGameServer from '@/lib/Pterodactyl/suspendServer/suspendServer';
import { headers } from 'next/headers';

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Unauthorized');
    return session;
}

export async function expireGameServer(id: string) {
    await requireAdmin();
    try {
        const res = await toggleSuspendGameServer(id, 'suspend');
        if (!res || !res.success) {
            throw new Error('Failed to suspend gameserver');
        }
        await prisma.gameServer.update({
            where: { id },
            data: { expires: new Date() },
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function hardDeleteGameServer(id: string, deleteOrders: boolean) {
    const session = await requireAdmin();

    try {
        const gameServer = await prisma.gameServer.findUniqueOrThrow({ where: { id } });

        if (gameServer.ptAdminId) {
            try {
                await deleteServerAdmin(gameServer.ptAdminId);
            } catch (error) {
                logger.warn('hardDeleteGameServer: Failed to delete from PT', 'SYSTEM', {
                    userId: session.user.id,
                    gameServerId: id,
                    details: { error },
                });
            }
        }

        if (deleteOrders) {
            await prisma.gameServerOrder.deleteMany({ where: { gameServerId: id } });
        }

        await prisma.gameServer.delete({ where: { id } });

        logger.info('hardDeleteGameServer: Server hard deleted', 'SYSTEM', {
            userId: session.user.id,
            gameServerId: id,
            details: { deleteOrders },
        });

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
