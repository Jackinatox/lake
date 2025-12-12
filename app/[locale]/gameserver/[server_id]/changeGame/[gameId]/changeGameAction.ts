'use server';

import { MinecraftGameId, SatisfactoryGameId } from '@/app/GlobalConstants';
import { auth } from '@/auth';
import { buildMC_ENVs_and_startup } from '@/lib/Pterodactyl/createServers/buildMinecraftENVs';
import ReinstallPTServerClient from '@/lib/Pterodactyl/Functions/ReinstallPTUserServer';
import PTUserServerPowerAction from '@/lib/Pterodactyl/Functions/StopPTUserServer';
import type { GameConfig } from '@/models/config';
import prisma from '@/lib/prisma';
import { env } from 'next-runtime-env';
import { headers } from 'next/headers';
import { GameData } from '@/app/client/generated/browser';

interface SubmitGameChangeInput {
    serverId: string;
    gameId: number;
    gameConfig: GameConfig;
    deleteFiles?: boolean;
}

export async function changeGame({
    serverId,
    gameId,
    gameConfig,
    deleteFiles = true,
}: SubmitGameChangeInput) {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const ptAdminKey = env('PTERODACTYL_API_KEY');
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey) {
        throw new Error('Not authenticated');
    }

    const [gameServer, newGameData] = await Promise.all([
        prisma.gameServer.findFirst({
            where: {
                ptServerId: serverId,
                userId: session.user.id,
                status: {
                    notIn: ['CREATION_FAILED', 'DELETED'],
                },
            },
        }),

        prisma.gameData.findUnique({ where: { id: gameId } }),
    ]);

    if (!gameServer) {
        throw new Error('Server not found or wrong user');
    }

    if (!newGameData) {
        throw new Error('Selected game not found');
    }

    await PTUserServerPowerAction(serverId, session.user.ptKey, 'kill');

    await new Promise((resolve) => setTimeout(resolve, 200)); // Wait so the server is really killed

    const response = await fetch(
        `${ptUrl}/api/application/servers/${gameServer.ptAdminId}/startup`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ptAdminKey}`,
                Accept: 'application/json',
            },
            body: JSON.stringify(await buildBody(gameConfig, newGameData)),
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from Pterodactyl:', errorData);
        throw new Error(`Failed to change game: ${response.status} ${JSON.stringify(errorData)}`);
    }

    await prisma.gameServer.update({
        where: { id: gameServer.id },
        data: {
            gameDataId: newGameData.id,
            gameConfig: gameConfig as any,
        },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Reinstall the server, optionally deleting all files first
    const response2 = await ReinstallPTServerClient(serverId, session.user.ptKey, deleteFiles);

    if (!response2.ok) {
        const errorData = await response2.json();
        console.error('Error response from Pterodactyl:', errorData);
        throw new Error(
            `Failed to restart server: ${response2.status} ${JSON.stringify(errorData)}`,
        );
    }

    return {
        success: true,
    };
}

async function buildBody(gameConfig: GameConfig, newGameData: GameData) {
    const plainBody = {
        skip_scripts: false,
        egg: gameConfig.eggId,
        image: gameConfig.dockerImage,
    };

    let body;
    switch (newGameData.id) {
        case MinecraftGameId:
            body = buildMC_ENVs_and_startup(gameConfig.eggId, gameConfig.version);
            break;
        case SatisfactoryGameId:
            // Build body for game 2
            throw new Error('Not implemented yet');
            break;
        default:
            throw new Error('Unsupported game ID');
    }

    return { ...plainBody, ...body };
}
