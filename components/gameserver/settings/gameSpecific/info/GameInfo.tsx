"use client"

import { GameServer } from '@/models/gameServerModel'
import React from 'react'
import MinecraftInfo from './MinecraftInfo'

interface GameInfoProps {
    server: GameServer
}

function GameInfo({ server }: GameInfoProps) {
    return (
        <>
            {server.egg_id === 1 && <MinecraftInfo server={server} />}
            {server.egg_id === 2 && <MinecraftInfo server={server} />}
            {server.egg_id === 3 && <MinecraftInfo server={server} />}
            {server.egg_id === 16 && <MinecraftInfo server={server} />}
        </>
    )
}

export default GameInfo