import { usePTEnv } from '@/hooks/usePTEnv';
import { GameServer } from '@/models/gameServerModel';
import { MinecraftConfig } from '@/models/gameSpecificConfig/MinecraftConfig';
import React from 'react';

interface MinecraftInfoProps {
    server: GameServer;
    apiKey: string;
}

function MinecraftInfo({ server, apiKey }: MinecraftInfoProps) {
    const { value, error, loading } = usePTEnv('MINECRAFT_VERSION', server.identifier, apiKey);

    if (error) {
        return <div className="text-red-500">Error loading Minecraft version</div>;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>{(server.gameData.gameSpecificConfig as MinecraftConfig).flavor + ' ' + value}</div>
    );
}

export default MinecraftInfo;
