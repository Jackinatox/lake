'use server';

import { auth } from '@/auth';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import ReinstallPTServerClient from '@/lib/Pterodactyl/Functions/ReinstallPTUserServer';

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
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptAdminKey = env('PTERODACTYL_API_KEY');
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error('Not authenticated');
    }

    const ptServer = await prisma.gameServer.findFirst({
        where: { ptServerId: server, userId: session.user.id },
    });

    if (!ptServer) {
        throw new Error('Server not found');
    }

    try {
        const admin = createPtClient();

        // Get full server details with admin API
        const adminServer = await fetch(`${ptUrl}/api/application/servers/${ptServer.ptAdminId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${ptAdminKey}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((server) => server.attributes);

        // Update the server Configuration
        const response = await fetch(
            `${ptUrl}/api/application/servers/${ptServer.ptAdminId}/startup`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${ptAdminKey}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    skip_scripts: false,
                    egg: adminServer.egg,
                    environment: adminServer.container.environment,
                    startup: adminServer.container.startup_command,
                    image: docker_image,
                }),
            },
        );
    } catch (error) {
        console.log(error);
        return false;
    }
    return true;
}
