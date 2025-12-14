'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import deleteServerAdmin from '@/lib/Pterodactyl/Functions/DeleteServerAdmin';
import ReinstallPTServerClient from '@/lib/Pterodactyl/Functions/ReinstallPTUserServer';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';

import { env } from 'next-runtime-env';
import { headers } from 'next/headers';

export async function renameClientServer(ptServerId: string, newName: string): Promise<boolean> {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return false;
    }

    if (newName.length > 200) return false;

    try {
        await fetch(`${ptUrl}/api/client/servers/${ptServerId}/settings/rename`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session?.user.ptKey}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: newName,
            }),
        });

        await prisma.gameServer.updateMany({
            where: {
                ptServerId: ptServerId,
            },
            data: {
                name: newName,
            },
        });
    } catch (error) {
        return false;
    }
    return true;
}

export async function reinstallServer(server: string): Promise<boolean> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user.ptKey) {
        logger.warn(`Reinstall attempt without authentication for server ${server}`, 'GAME_SERVER');
        return false;
    }

    try {
        logger.info(`initiating reinstall for server ${server}`, 'GAME_SERVER', {
            userId: session.user.id,
        });
        const response = await ReinstallPTServerClient(server, session.user.ptKey, false);

        if (!response.ok) {
            logger.error(`Reinstall failed for server ${server}`, 'GAME_SERVER', {
                userId: session.user.id,
                gameServerId: server,
                details: { response: JSON.stringify(response) }
            });
            return false;
        }

        return true;
    } catch (error) {
        logger.error(`Exception during server reinstall for ${server}`, 'GAME_SERVER', {
            userId: session.user.id,
            details: { error },
        });
        return false;
    }
}

export async function changeServerStartup(server: string, docker_image: string): Promise<boolean> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error('Not authenticated');
    }

    const ptServer = await prisma.gameServer.findFirst({
        where: { ptServerId: server, userId: session.user.id },
    });

    if (!ptServer || !ptServer.ptAdminId) {
        throw new Error('Server not found');
    }

    return await changeServerDockerImageInternal(ptServer.ptAdminId.toString(), docker_image);
}

/**
 * Internal server-only function to change server docker image and startup configuration.
 * This function uses admin API key and should NEVER be exposed to client-side code.
 * 
 * @param ptAdminId - Pterodactyl admin server ID
 * @param docker_image - Docker image to set (null to keep existing)
 * @param skipScripts - Whether to skip install scripts
 * @returns true if successful, false otherwise
 */
async function changeServerDockerImageInternal(ptAdminId: string, docker_image: string | null, skipScripts: boolean = false): Promise<boolean> {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptAdminKey = env('PTERODACTYL_API_KEY');
    try {
        // Get full server details with admin API
        const adminServer = await fetch(`${ptUrl}/api/application/servers/${ptAdminId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${ptAdminKey}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((server) => server.attributes);


        const body = JSON.stringify({
            skip_scripts: skipScripts,
            egg: adminServer.egg,
            environment: adminServer.container.environment,
            startup: adminServer.container.startup_command,
            image: docker_image || adminServer.container.image,
        });

        // Update the server Configuration
        const response = await fetch(
            `${ptUrl}/api/application/servers/${ptAdminId}/startup`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${ptAdminKey}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body
            },
        );

        if (!response.ok) {
            const errorData = await response.text();
            logger.error('Failed to change server docker image', 'GAME_SERVER', {
                details: { ptAdminId, docker_image, status: response.status, error: errorData },
            });
            return false;
        }
    } catch (error) {
        logger.error('Failed to change server docker image', 'GAME_SERVER', {
            details: { ptAdminId, docker_image, error },
        });
        return false;
    }
    return true;
}

/**
 * Server-only function to enable install scripts after initial server creation.
 * This is used during provisioning to re-enable scripts after creating server with skipScripts: true.
 * Should only be called from server-side code like provisionServer.ts
 * 
 * @param ptAdminId - Pterodactyl admin server ID
 * @returns true if successful, false otherwise
 */
export async function enableServerInstallScripts(
    ptAdminId: number,
): Promise<boolean> {
    logger.info(`Enabling install scripts for server ${ptAdminId}`, 'GAME_SERVER');

    const success = await changeServerDockerImageInternal(ptAdminId.toString(), null, false);

    if (!success) {
        logger.error(`Failed to enable install scripts for server ${ptAdminId}`, 'GAME_SERVER');
    }

    return success;
}

/**
 * This currently verifies ownership and that the server is FREE and then returns true.
 */
export async function deleteFreeServer(ptServerId: string): Promise<boolean> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        logger.warn(`Delete attempt without authentication for server ${ptServerId}`, 'GAME_SERVER');
        return false;
    }

    const server = await prisma.gameServer.findFirst({ where: { ptServerId, userId: session.user.id } });

    if (!server || !server.ptAdminId) {
        logger.warn(`Delete attempt for unknown server ${ptServerId} by user ${session.user.id}`, 'GAME_SERVER');
        return false;
    }

    if (server.type !== 'FREE') {
        logger.warn(`Delete attempt for non-free server ${ptServerId} by user ${session.user.id}`, 'GAME_SERVER');
        return false;
    }

    try {
        await deleteServerAdmin(server.ptAdminId)
        await prisma.gameServer.update({
            where: { id: server.id },
            data: { status: 'DELETED' },
        });
    } catch (error) {
        logger.error(`Failed to delete free server ${ptServerId}`, 'GAME_SERVER', {
            userId: session.user.id,
            gameServerId: server.id,
            details: { error },
        });
        return false;
    }

    logger.info(`deleteFreeServer requested for server ${ptServerId} by user ${session.user.id}`, 'GAME_SERVER');
    return true;
}
