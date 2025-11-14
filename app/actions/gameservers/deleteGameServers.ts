'use server';
import { auth } from '@/auth';
import { env } from 'next-runtime-env';
import { prisma } from '@/prisma';
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
            const gameServer = await prisma.gameServer.findUnique({ where: { id } });
            if (!gameServer) {
                continue;
            }
            if (gameServer.status === 'DELETED' || gameServer.status === 'CREATION_FAILED') {
                deletedIds.push(id);
                continue;
            }
            const response = await fetch(
                env('NEXT_PUBLIC_PTERODACTYL_URL') +
                    `/api/application/servers/${gameServer.ptAdminId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${env('PTERODACTYL_API_KEY')}`,
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                },
            );
            if (response.ok) {
                deletedIds.push(id);
            } else {
                const errorData = await response.json();
                errors.push(
                    `Failed to delete server ${id}: ${errorData.errors ? JSON.stringify(errorData.errors) : response.statusText}`,
                );
            }
        } catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
        }
    }

    try {
        for (const id of deletedIds) {
            await prisma.gameServer.delete({
                where: { id: id },
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
