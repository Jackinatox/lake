import { env } from 'bun';
import type { GameServer } from '../../generated/client';
import { prisma } from '../../prisma';
import { logInfo, logError } from '../../lib/logger';
import { WorkerJobType } from '../../generated/client';

export async function handleExpired(server: GameServer, jobRun: string) {
    try {
        await logInfo(
            WorkerJobType.EXPIRE_SERVERS,
            `Starting to handle expired server`,
            {
                serverId: server.id,
                expires: server.expires,
                currentStatus: server.status,
            },
            { gameServerId: server.id, userId: server.userId, jobRun },
        );

        await suspendServer(server, jobRun);

        await prisma.gameServer.update({
            where: { id: server.id },
            data: { status: 'EXPIRED' },
        });

        await logInfo(
            WorkerJobType.EXPIRE_SERVERS,
            `Server marked as EXPIRED in database`,
            {
                serverId: server.id,
                newStatus: 'EXPIRED',
            },
            { gameServerId: server.id, userId: server.userId, jobRun },
        );

        console.log(`Server ${server.id} marked as EXPIRED in database.`);
    } catch (error) {
        await logError(
            WorkerJobType.EXPIRE_SERVERS,
            `Failed to handle expired server`,
            {
                serverId: server.id,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                serverDetails: {
                    id: server.id,
                    expires: server.expires,
                    status: server.status,
                    ptAdminId: server.ptAdminId,
                },
            },
            { gameServerId: server.id, userId: server.userId, jobRun },
        );

        throw error; // Re-throw to maintain existing error handling behavior
    }
}

async function suspendServer(server: GameServer, jobRun: string) {
    if (!server.ptAdminId || !server.ptServerId) {
        throw new Error(`Missing Pterodactyl IDs for server ${server.id}`);
    }

    await logInfo(
        WorkerJobType.EXPIRE_SERVERS,
        `Suspending server via Pterodactyl API`,
        {
            serverId: server.id,
            ptAdminId: server.ptAdminId,
        },
        { gameServerId: server.id, userId: server.userId, jobRun },
    );

    const response = await fetch(
        env.NEXT_PUBLIC_PTERODACTYL_URL + `/api/application/servers/${server.ptAdminId}/suspend`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.PTERODACTYL_API_KEY}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Pterodactyl API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
    }

    await logInfo(
        WorkerJobType.EXPIRE_SERVERS,
        `Successfully suspended server via Pterodactyl API`,
        {
            serverId: server.id,
            ptAdminId: server.ptAdminId,
            responseStatus: response.status,
        },
        { gameServerId: server.id, userId: server.userId, jobRun },
    ).catch(() => {
        console.log('Failed to log suspension success - THIS IS SUPER-CRITICAL');
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
}
