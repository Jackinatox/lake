'use server';

import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import type { GameConfig } from '@/models/config';
import { changeGameRequestSchema } from '@/lib/validation/gameserver';
import { env } from 'next-runtime-env';
import { headers } from 'next/headers';

interface SubmitGameChangeInput {
    ptServerId: string;
    gameSlug: string;
    gameConfig: GameConfig;
    deleteFiles?: boolean;
}

export async function changeGame({
    ptServerId,
    gameSlug,
    gameConfig,
    deleteFiles = true,
}: SubmitGameChangeInput) {
    const parsed = changeGameRequestSchema.parse({
        ptServerId,
        gameConfig,
        gameEggId: gameConfig.eggId,
        deleteFiles,
        gameSlug
    });
    const workerUrl = env('WORKER_IP');
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey) {
        throw new Error('Not authenticated');
    }

    const server = await prisma.gameServer.findFirst({
        where: { ptServerId: parsed.ptServerId, userId: session.user.id },
    });
    const selectedGame = await prisma.gameData.findUnique({
        where: { slug: parsed.gameSlug },
        select: { slug: true },
    });

    if (!server) {
        throw new Error('Server not found or wrong user');
    }
    if (!selectedGame) {
        throw new Error('Game not found');
    }
    if (selectedGame.slug !== parsed.gameConfig.gameSlug) {
        throw new Error('Game configuration does not match the selected game');
    }

    logger.info(
        `Changing Game for ${parsed.ptServerId} for user ${session.user.id} to game ${parsed.gameSlug}`,
        'GAME_SERVER',
    );
    const response = await fetch(`${workerUrl}/v1/queue/changeGame`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            gameSlug: parsed.gameSlug,
            ptServerId: parsed.ptServerId,
            userId: session.user.id,
            deleteFiles: parsed.deleteFiles,
            gameConfig: parsed.gameConfig,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        logger.error('Error response from worker:', 'GAME_SERVER', errorData);
        throw new Error(`Failed to change game: ${response.status} ${JSON.stringify(errorData)}`);
    }

    // Reinstall the server is done on the worker

    // OK
    return {
        success: true,
    };
}
