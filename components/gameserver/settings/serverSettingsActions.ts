'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import deleteServerAdmin from '@/lib/Pterodactyl/Functions/DeleteServerAdmin';
import ReinstallPTServerClient from '@/lib/Pterodactyl/Functions/ReinstallPTUserServer';
import {
    reinstallServerSchema,
    renameServerSchema,
    serverStartupSchema,
} from '@/lib/validation/gameserver';
import { serverIdentifierSchema } from '@/lib/validation/common';

import { env } from 'next-runtime-env';
import { headers } from 'next/headers';

export async function renameClientServer(ptServerId: string, newName: string): Promise<boolean> {
    const parsedResult = renameServerSchema.safeParse({ ptServerId, newName });
    if (!parsedResult.success) {
        return false;
    }
    const parsed = parsedResult.data;
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.ptKey) {
        return false;
    }

    const server = await prisma.gameServer.findFirst({
        where: {
            ptServerId: parsed.ptServerId,
            userId: session.user.id,
        },
        select: {
            id: true,
        },
    });

    if (!server) {
        logger.warn(
            `Rename attempt for unknown or unowned server ${parsed.ptServerId} by user ${session.user.id}`,
            'GAME_SERVER',
            {
                userId: session.user.id,
                details: { ptServerId: parsed.ptServerId },
            },
        );
        return false;
    }

    try {
        const response = await fetch(
            `${ptUrl}/api/client/servers/${parsed.ptServerId}/settings/rename`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${session.user.ptKey}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: parsed.newName,
                }),
            },
        );

        if (!response.ok) {
            logger.error(`Failed to rename server ${parsed.ptServerId}`, 'GAME_SERVER', {
                userId: session.user.id,
                details: {
                    ptServerId: parsed.ptServerId,
                    status: response.status,
                    statusText: response.statusText,
                },
            });
            return false;
        }

        await prisma.gameServer.update({
            where: {
                id: server.id,
            },
            data: {
                name: parsed.newName,
            },
        });
    } catch (error) {
        logger.error(`Failed to rename server ${parsed.ptServerId}`, 'GAME_SERVER', {
            userId: session.user.id,
            details: { ptServerId: parsed.ptServerId, error },
        });
        return false;
    }
    return true;
}

export async function reinstallServer(server: string, deleteAllFiles = false): Promise<boolean> {
    const parsedResult = reinstallServerSchema.safeParse({
        ptServerId: server,
        deleteAllFiles,
    });
    if (!parsedResult.success) {
        return false;
    }
    const parsed = parsedResult.data;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.ptKey) {
        logger.warn(
            `Reinstall attempt without authentication for server ${parsed.ptServerId}`,
            'GAME_SERVER',
            { details: { ptServerId: parsed.ptServerId } },
        );
        return false;
    }

    const serverRecord = await prisma.gameServer.findFirst({
        where: { ptServerId: parsed.ptServerId, userId: session.user.id },
        select: {
            id: true,
        },
    });

    if (!serverRecord) {
        logger.warn(
            `Reinstall attempt for unknown or unowned server ${parsed.ptServerId}`,
            'GAME_SERVER',
            {
                userId: session.user.id,
                details: { ptServerId: parsed.ptServerId },
            },
        );
        return false;
    }

    try {
        logger.info(`initiating reinstall for server ${parsed.ptServerId}`, 'GAME_SERVER', {
            userId: session.user.id,
            details: {
                ptServerId: parsed.ptServerId,
                deleteAllFiles: parsed.deleteAllFiles,
            },
        });
        const response = await ReinstallPTServerClient(
            parsed.ptServerId,
            session.user.ptKey,
            parsed.deleteAllFiles,
        );

        if (!response.ok) {
            logger.error(`Reinstall failed for server ${parsed.ptServerId}`, 'GAME_SERVER', {
                userId: session.user.id,
                gameServerId: parsed.ptServerId,
                details: { ptServerId: parsed.ptServerId, response: JSON.stringify(response) },
            });
            return false;
        }

        return true;
    } catch (error) {
        logger.error(`Exception during server reinstall for ${parsed.ptServerId}`, 'GAME_SERVER', {
            userId: session.user.id,
            details: { ptServerId: parsed.ptServerId, error },
        });
        return false;
    }
}

export async function changeServerStartup(server: string, docker_image: string): Promise<boolean> {
    const parsed = serverStartupSchema.parse({ ptServerId: server, dockerImage: docker_image });
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.ptKey) {
        throw new Error('Not authenticated');
    }

    const ptServer = await prisma.gameServer.findFirst({
        where: { ptServerId: parsed.ptServerId, userId: session.user.id },
    });

    if (!ptServer || !ptServer.ptAdminId) {
        throw new Error('Server not found');
    }

    const allowedDockerImages = await fetchAllowedDockerImages(
        parsed.ptServerId,
        session.user.ptKey,
    );

    if (!allowedDockerImages.has(parsed.dockerImage)) {
        logger.warn(
            `Rejected unsupported docker image for server ${parsed.ptServerId}`,
            'GAME_SERVER',
            {
                userId: session.user.id,
                details: {
                    ptServerId: parsed.ptServerId,
                    dockerImage: parsed.dockerImage,
                },
            },
        );
        return false;
    }

    return await changeServerDockerImageInternal(ptServer.ptAdminId.toString(), parsed.dockerImage);
}

async function fetchAllowedDockerImages(ptServerId: string, ptKey: string): Promise<Set<string>> {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');

    try {
        const response = await fetch(`${ptUrl}/api/client/servers/${ptServerId}/startup`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${ptKey}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            logger.error('Failed to load allowed docker images', 'GAME_SERVER', {
                details: { ptServerId, status: response.status },
            });
            return new Set();
        }

        const data: PterodactylStartupResponse = await response.json();
        return new Set(Object.values(data.meta?.docker_images ?? {}));
    } catch (error) {
        logger.error('Failed to load allowed docker images', 'GAME_SERVER', {
            details: { ptServerId, error },
        });
        return new Set();
    }
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
async function changeServerDockerImageInternal(
    ptAdminId: string,
    docker_image: string | null,
    skipScripts: boolean = false,
): Promise<boolean> {
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
        const response = await fetch(`${ptUrl}/api/application/servers/${ptAdminId}/startup`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${ptAdminKey}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body,
        });

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
export async function enableServerInstallScripts(ptAdminId: number): Promise<boolean> {
    logger.info(`Enabling install scripts for server ${ptAdminId}`, 'GAME_SERVER', {
        details: { ptAdminId },
    });

    const success = await changeServerDockerImageInternal(ptAdminId.toString(), null, false);

    if (!success) {
        logger.error(`Failed to enable install scripts for server ${ptAdminId}`, 'GAME_SERVER', {
            details: { ptAdminId },
        });
    }

    return success;
}

/**
 * This currently verifies ownership and that the server is FREE and then returns true.
 */
export async function deleteFreeServer(ptServerId: string): Promise<boolean> {
    const parsedId = serverIdentifierSchema.safeParse(ptServerId);
    if (!parsedId.success) {
        return false;
    }
    const validatedServerId = parsedId.data;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        logger.warn(
            `Delete attempt without authentication for server ${validatedServerId}`,
            'AUTHENTICATION',
            { details: { ptServerId: validatedServerId } },
        );
        return false;
    }

    const server = await prisma.gameServer.findFirst({
        where: { ptServerId: validatedServerId, userId: session.user.id },
    });

    if (!server || !server.ptAdminId) {
        logger.warn(
            `Delete attempt for unknown server ${validatedServerId} by user ${session.user.id}`,
            'GAME_SERVER',
            { userId: session.user.id, details: { ptServerId: validatedServerId } },
        );
        return false;
    }

    if (server.type !== 'FREE') {
        logger.warn(
            `Delete attempt for non-free server ${validatedServerId} by user ${session.user.id}`,
            'GAME_SERVER',
            {
                userId: session.user.id,
                gameServerId: server.id,
                details: { ptServerId: validatedServerId, ptAdminId: server.ptAdminId },
            },
        );
        return false;
    }

    try {
        await deleteServerAdmin(server.ptAdminId);
        await prisma.gameServer.update({
            where: { id: server.id },
            data: { status: 'DELETED' },
        });
    } catch (error) {
        logger.error(`Failed to delete free server ${validatedServerId}`, 'GAME_SERVER', {
            userId: session.user.id,
            gameServerId: server.id,
            details: { ptServerId: validatedServerId, ptAdminId: server.ptAdminId, error },
        });
        return false;
    }

    logger.info(
        `deleteFreeServer requested for server ${validatedServerId} by user ${session.user.id}`,
        'GAME_SERVER',
        {
            userId: session.user.id,
            gameServerId: server.id,
            details: { ptServerId: validatedServerId, ptAdminId: server.ptAdminId },
        },
    );
    return true;
}

interface PterodactylStartupResponse {
    meta?: {
        docker_images?: Record<string, string>;
    };
}
