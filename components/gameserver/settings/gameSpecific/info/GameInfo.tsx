'use client';

import {
    FabricEggId,
    ForgeEggId,
    NeoForgeEggId,
    PaperEggId,
    VanillaEggId,
} from '@/app/GlobalConstants';
import { GameServer } from '@/models/gameServerModel';
import MinecraftInfo from './MinecraftInfo';

interface GameInfoProps {
    server: GameServer;
    apiKey: string;
}

function GameInfo({ server, apiKey }: GameInfoProps) {
    return (
        <>
            {server.egg_id === PaperEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
            {server.egg_id === VanillaEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
            {server.egg_id === ForgeEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
            {server.egg_id === FabricEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
            {server.egg_id === NeoForgeEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
            {/* TODO: add satis info */}
        </>
    );
}

export default GameInfo;
