"use client"

import { GameServer } from "@/models/gameServerModel"
import ServerSettingsCard from "./ServerSettingsCard"
import MinecraftSettings from "./gameSpecific/MinecraftSettings"

interface GameServerSettingsProps {
  server: GameServer
}

export default function GameServerSettings({ server }: GameServerSettingsProps) {
  return (
    <>
      <div className="space-y-2">
        <ServerSettingsCard server={server} />
        {server.egg_id === 1 && <MinecraftSettings server={server} />}
        {server.egg_id === 2 && <MinecraftSettings server={server} />}
        {server.egg_id === 3 && <MinecraftSettings server={server} />}
        {server.egg_id === 4 && <MinecraftSettings server={server} />}
        {server.egg_id === 5 && <MinecraftSettings server={server} />}
      </div>
    </>
  )
}
