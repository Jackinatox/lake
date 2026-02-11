import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import GamesAfterHardwareClient from './GamesAfterHardwareClient';

export default async function GamesAfterHardwarePage() {
    const games = await prisma.gameData.findMany({
        select: { id: true, name: true, slug: true },
        where: { enabled: true },
        orderBy: { sorting: 'asc' },
    });

    const gameCards = games.map((game) => {
        const imgName = `${game.name.toLowerCase()}.webp`;
        return {
            ...game,
            images: {
                dark: `/images/dark/games/icons/${imgName}`,
                light: `/images/light/games/icons/${imgName}`,
            },
        };
    });

    return (
        <Suspense>
            <GamesAfterHardwareClient games={gameCards} />
        </Suspense>
    );
}
