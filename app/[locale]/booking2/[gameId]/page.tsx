'use server';

import { fetchGames as fetchGame, fetchPerformanceGroups } from '@/lib/actions';
import type { GameConfig, HardwareConfig } from '@/models/config';
import { getTranslations } from 'next-intl/server';
import GameNotFound from '@/components/booking2/GameNotFound';
import LoadingError from '@/components/booking2/LoadingError';
import GameServerConfig from './OrderComponent';
import prisma from '@/lib/prisma';

export type ServerConfig = {
    hardwareConfig: HardwareConfig;
    gameConfig: GameConfig;
};

export default async function page({ params }: { params: Promise<{ gameId: string }> }) {
    const t = await getTranslations('buyGameServer');
    const rawGameId = (await params).gameId as string;
    const gameId = Number.parseInt(rawGameId, 10);
    const safeGameId = Number.isNaN(gameId) ? -1 : gameId;

    const [performanceGroupData, game, hardwareRecommendations] = await Promise.all([
        fetchPerformanceGroups(),
        fetchGame(safeGameId),
        prisma.hardwareRecommendation.findMany({
            where: {
                gameDataId: safeGameId,
            },
            orderBy: {
                sorting: 'asc',
            },
        }),
    ]);

    if (!game) {
        return <GameNotFound linkBackTo="/products/gameserver" />;
    }

    if (!performanceGroupData) {
        return <LoadingError />;
    }

    return (
        <>
            <GameServerConfig
                performanceGroups={performanceGroupData}
                game={game}
                hardwareRecommendation={hardwareRecommendations}
            />
        </>
    );
}
