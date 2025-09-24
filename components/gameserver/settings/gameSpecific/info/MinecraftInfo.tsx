import { GameServer } from '@/models/gameServerModel'
import React from 'react'

interface MinecraftInfoProps {
    server: GameServer
}

function MinecraftInfo({ server }: MinecraftInfoProps) {
    return (
        <div>{server.gameData.gameSpecificConfig.flavor + " " + server.gameData.version}</div>
    )
}

export default MinecraftInfo