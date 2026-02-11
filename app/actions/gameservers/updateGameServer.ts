'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
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
    if (cpuPercent <= 0 || cpuPercent > 1600) {
        return {
            success: false,
            error: 'CPU must be between 1% and 1600%',
        };
    }

    if (ramMB < 512 || ramMB > 32768) {
        return {
            success: false,
            error: 'RAM must be between 512 MiB and 32 GiB',
        };
    }

    if (diskMB < 1024 || diskMB > 512000) {
        return {
            success: false,
            error: 'Disk must be between 1 GiB and 500 GiB',
        };
    }

    if (backupCount < 0 || backupCount > 10) {
        return {
            success: false,
            error: 'Backup count must be between 0 and 10',
        };
    }

    try {
        await prisma.gameServer.update({
            where: { id },
            data: {
                cpuPercent,
                ramMB,
                diskMB,
                backupCount,
            },
        });

        return {
            success: true,
        };
    } catch (error: any) {
        return {
            success: false,
            error: `Failed to update server: ${error.message}`,
        };
    }
}
