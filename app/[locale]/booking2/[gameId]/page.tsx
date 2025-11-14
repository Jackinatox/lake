'use server';

import { useToast } from '@/hooks/use-toast';
import { fetchGames as fetchGame, fetchPerformanceGroups } from '@/lib/actions';
import { authClient } from '@/lib/auth-client';
import type { Game, GameConfig, HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import { getTranslations } from 'next-intl/server';
import GameServerConfig from './OrderComponent';
import NotLoggedIn from '@/components/auth/NoAuthMessage';

export type ServerConfig = {
    hardwareConfig: HardwareConfig;
    gameConfig: GameConfig;
};

export default async function page({ params }: { params: Promise<{ gameId: string }> }) {
    const session = await authClient.getSession();

    if (!session) {
        // TODO: only for final order
        return <NotLoggedIn />;
    }

    const t = await getTranslations('buyGameServer');
    const gameId = Number.parseInt((await params).gameId as string, 10);
    console.log('Game id:' + gameId);

    const [performanceGroupData, game] = await Promise.all([
        fetchPerformanceGroups(),
        fetchGame(gameId),
    ]);

    if (!game || !performanceGroupData) {
        return <div>error</div>;
    }

    return (
        <>
            <GameServerConfig
                performanceGroups={performanceGroupData}
                game={game}
                gameId={gameId}
            />
        </>
    );
}
