'use server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';

import deleteServerAdmin from '@/lib/Pterodactyl/Functions/DeleteServerAdmin';
import { headers } from 'next/headers';

export async function deleteGameServers(ids: string[]) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (session?.user.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    if (!Array.isArray(ids) || ids.length === 0)
        return { success: false, error: 'No IDs provided' };

    const deletedIds: string[] = [];
    const errors: string[] = [];

    for (const id of ids) {
        try {
            const gameServer = await prisma.gameServer.findUniqueOrThrow({ where: { id } });
            if (!gameServer.ptAdminId) {
                logger.warn('GameServer Deletion: ', 'SYSTEM', {
                    details: { error: `Game server with ID ${id} missing ptAdminId` },
                });
                deletedIds.push(id);
                continue;
            }
            if (gameServer.status === 'DELETED') {
                continue;
            }

            if (gameServer.status === 'CREATION_FAILED') {
                deletedIds.push(id);
                continue;
            }

            try {
                await deleteServerAdmin(gameServer.ptAdminId);
                deletedIds.push(id);
            } catch (error: any) {
                errors.push(`Failed to delete server ${id}: ${error.toString()} `);
            }
        } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
        for (const id of deletedIds) {
            await prisma.gameServer.update({
                where: { id: id },
                data: { status: 'DELETED' },
            });
        }
        if (errors.length > 0) {
            return { success: false, error: errors.join(', ') };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
