"use client"

import { GameServer } from '@/models/gameServerModel'
import React from 'react'
import MinecraftInfo from './MinecraftInfo'
import { FabricEggId, ForgeEggId, PaperEggId, VanillaEggId } from '@/app/GlobalConstants'

interface GameInfoProps {
    server: GameServer
    apiKey: string
}

function GameInfo({ server, apiKey }: GameInfoProps) {
    return (
        <>
            {server.egg_id === PaperEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
            {server.egg_id === VanillaEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
            {server.egg_id === ForgeEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
            {server.egg_id === FabricEggId && <MinecraftInfo server={server} apiKey={apiKey} />}
        </>
    )
}

export default GameInfo