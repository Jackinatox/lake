'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { env } from 'next-runtime-env';
import { headers } from 'next/headers';

export interface UpdateGameServerInput {
    id: string;
    cpuPercent: number;
    ramMB: number;
    diskMB: number;
    backupCount: number;
}

export async function updateGameServer(input: UpdateGameServerInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return {
            success: false,
            error: 'Unauthorized: Admin access required',
        };
    }

    const { id, cpuPercent, ramMB, diskMB, backupCount } = input;

    // Validate inputs
    if (cpuPercent <= 0 || cpuPercent > 3200) {
        return {
            success: false,
            error: 'CPU must be between 1% and 3200%',
        };
    }

    if (ramMB < 512 || ramMB > 65536) {
        return {
            success: false,
            error: 'RAM must be between 512 MiB and 64 GiB',
        };
    }

    if (diskMB < 1024 || diskMB > 512000) {
        return {
            success: false,
            error: 'Disk must be between 1 GiB and 500 GiB',
        };
    }

    if (backupCount < 0 || backupCount > 50) {
        return {
            success: false,
            error: 'Backup count must be between 0 and 50',
        };
    }

    try {
        const gameServer = await prisma.gameServer.findUniqueOrThrow({
            where: { id },
        });

        if (!gameServer.ptAdminId) {
            return {
                success: false,
                error: 'Server has no Pterodactyl ID',
            };
        }

        const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
        const ptApiKey = env('PTERODACTYL_API_KEY');
        const pt = createPtClient();

        const ptServer = await pt.getServer(gameServer.ptAdminId.toString());

        const response = await fetch(
            `${panelUrl}/api/application/servers/${gameServer.ptAdminId}/build`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    allocation: ptServer.allocation,
                    memory: ramMB,
                    swap: ptServer.limits.swap,
                    disk: diskMB,
                    io: ptServer.limits.io,
                    cpu: cpuPercent,
                    feature_limits: {
                        allocations: ptServer.featureLimits.allocations,
                        databases: ptServer.featureLimits.databases,
                        backups: backupCount,
                    },
                }),
            },
        );

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            return {
                success: false,
                error: `Pterodactyl API error: ${response.status} ${JSON.stringify(errorBody)}`,
            };
        }

        await prisma.gameServer.update({
            where: { id },
            data: {
                cpuPercent,
                ramMB,
                diskMB,
                backupCount,
            },
        });

        await logger.info('Admin updated server hardware resources', 'GAME_SERVER', {
            userId: session.user.id,
            gameServerId: id,
            details: {
                before: {
                    cpuPercent: gameServer.cpuPercent,
                    ramMB: gameServer.ramMB,
                    diskMB: gameServer.diskMB,
                    backupCount: gameServer.backupCount,
                },
                after: { cpuPercent, ramMB, diskMB, backupCount },
            },
        });

        return { success: true };
    } catch (error: any) {
        await logger.error('Failed to update server hardware resources', 'GAME_SERVER', {
            userId: session?.user.id,
            gameServerId: id,
            details: { error: error.message },
        });
        return {
            success: false,
            error: `Failed to update server: ${error.message}`,
        };
    }
}
