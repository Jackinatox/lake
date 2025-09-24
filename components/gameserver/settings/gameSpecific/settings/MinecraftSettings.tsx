"use client"

import { GameServer } from '@/models/gameServerModel'
import React from 'react'
import { MinecraftFlavorDialog } from './MinecraftFlavorDialog'

interface MinecraftSettingsProps {
    server: GameServer
}

function MinecraftSettings({ server }: MinecraftSettingsProps) {
    return (
        <MinecraftFlavorDialog eggId={server.egg_id} server={server} />
    )
}

export default MinecraftSettings