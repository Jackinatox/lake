'use server';

import { Game } from '@/models/config';
import prisma from '@/lib/prisma';

export async function fetchPerformanceGroups() {
    const data = await prisma.location.findMany({
        include: {
            cpu: true,
            ram: true,
        },
        where: {
            enabled: true,
            freeServer: false,
        },
        orderBy: {
            id: 'asc',
        },
    });

    return data;
}

export async function fetchGames(gameId: number): Promise<Game | null> {
    const game = await prisma.gameData.findUnique({
        where: {
            id: gameId,
            enabled: true,
        },
        select: {
            id: true,
            name: true,
            data: true,
        },
    });

    if (!game) return null;

    return {
        data: game.data,
        id: game.id,
        name: game.name,
    };
}
