"use client"

import { GameServer } from "@/models/gameServerModel"
import ServerSettingsCard from "./ServerSettingsCard"
import MinecraftSettings from "./gameSpecific/settings/MinecraftSettings"
import { FabricEggId, ForgeEggId, PaperEggId, VanillaEggId } from "@/app/GlobalConstants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ReinstallDialog from "./ReinstallDialog"
import { Settings, Gamepad2 } from "lucide-react"

interface GameServerSettingsProps {
  server: GameServer
  apiKey?: string
}

export default function GameServerSettings({ server, apiKey }: GameServerSettingsProps) {
  const isMinecraftServer = [PaperEggId, VanillaEggId, ForgeEggId, FabricEggId].includes(server.egg_id)

  return (
    <div className="w-full mx-auto">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Settings className="h-6 w-6 sm:h-7 sm:w-7" />
          <h1 className="text-2xl sm:text-3xl font-bold">Server Settings</h1>
        </div>

        {/* Server Settings Card */}
        <div className="w-full">
          <ServerSettingsCard server={server} />
        </div>

        {/* Game-Specific Settings */}
        {isMinecraftServer && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Gamepad2 className="h-5 w-5" />
                Game-Specific Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <MinecraftSettings server={server} apiKey={apiKey} />
            </CardContent>
          </Card>
        )}

        {/* Server Management Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Server Management</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  These actions can affect your server's functionality. Please use with caution.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <ReinstallDialog apiKey={apiKey} server_id={server.identifier}/>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
