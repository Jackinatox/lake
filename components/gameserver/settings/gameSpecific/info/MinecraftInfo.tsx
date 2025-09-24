import { GameServer } from '@/models/gameServerModel'
import { MinecraftConfig } from '@/models/gameSpecificConfig/MinecraftConfig'
import React from 'react'

interface MinecraftInfoProps {
    server: GameServer
}

function MinecraftInfo({ server }: MinecraftInfoProps) {
    return (
        <div>{(server.gameData.gameSpecificConfig as MinecraftConfig).flavor + " " + server.gameData.version}</div>
    )
}

export default MinecraftInfo