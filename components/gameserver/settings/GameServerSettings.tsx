"use client"

import { GameServer } from "@/models/gameServerModel"
import ServerSettingsCard from "./ServerSettingsCard"
import MinecraftSettings from "./gameSpecific/settings/MinecraftSettings"
import { FabricEggId, ForgeEggId, PaperEggId, VanillaEggId } from "@/app/GlobalConstants"

interface GameServerSettingsProps {
  server: GameServer
}

export default function GameServerSettings({ server }: GameServerSettingsProps) {
  return (
    <>
      <div className="space-y-2">
        <ServerSettingsCard server={server} />
        {server.egg_id === PaperEggId && <MinecraftSettings server={server} />}
        {server.egg_id === VanillaEggId && <MinecraftSettings server={server} />}
        {server.egg_id === ForgeEggId && <MinecraftSettings server={server} />}
        {server.egg_id === FabricEggId && <MinecraftSettings server={server} />}
      </div>
    </>
  )
}
