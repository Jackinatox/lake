'use client';

import { GameServer } from '@/models/gameServerModel';
import MinecraftInfo from './MinecraftInfo';

interface GameInfoProps {
    server: GameServer;
    apiKey: string;
}

function GameInfo({ server, apiKey }: GameInfoProps) {
    return (
        <div className="pr-2">
            {server.gameSlug === 'minecraft' && <MinecraftInfo server={server} apiKey={apiKey} />}
            {/* TODO: add satis info */}
        </div>
    );
}

export default GameInfo;
