"use client"

import { GameServer } from '@/models/gameServerModel'
import React from 'react'
import { MinecraftFlavorDialog } from './MinecraftFlavorDialog'
import { usePTEnv } from '@/hooks/usePTEnv'

interface MinecraftSettingsProps {
    server: GameServer
    apiKey?: string
}

function MinecraftSettings({ server, apiKey }: MinecraftSettingsProps) {
    const { value, error, loading, setValue } = usePTEnv("MINECRAFT_VERSION", server.identifier, apiKey);

    return (
        <>
            <div>minecraft version: {value} error: {JSON.stringify(error)} loading: {loading}</div>
            <MinecraftFlavorDialog eggId={server.egg_id} server={server} />
        </>
    )
}

export default MinecraftSettings