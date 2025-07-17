"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Game, GameConfig, SatisfactoryConfig } from "@/models/config"

interface SatisfactoryConfigProps {
  onChange: (config: Record<string, any>) => void
  game: Game
  onSubmit: (config: GameConfig) => void
}

export const SatisfactoryConfigComponent = forwardRef(({ onChange, game, onSubmit }: SatisfactoryConfigProps, ref) => {
  const [config, setConfig] = useState<SatisfactoryConfig>({
    isEarlyAccess: false,
    maxPlayers: 8,
    serverName: "My Satisfactory Server",
  })

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    if (onChange) onChange(newConfig)
  }

  useImperativeHandle(ref, () => ({
    submit: () => {
      // For Satisfactory, we just need an environment variable to switch between early access and production
      const envVars = {
        SATISFACTORY_EXPERIMENTAL: config.isEarlyAccess ? "true" : "false",
      }

      // Create a complete game configuration object
      const completeConfig: GameConfig = {
        gameId: game.id,
        gameType: game.name,
        eggId: 1,     // ToDo: for satsi release add dynamic ids
        flavorId: 1, // Assuming there's only one flavor for Satisfactory
        version: "latest", // Assuming we always use the latest version
        dockerImage: 'placeHolderImage', // TODO: Satisfactory set correct docker image
        gameSpecificConfig: {
          ...config,
        },
      }

      // Pass the complete configuration to the parent component
      onSubmit(completeConfig)
    }
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl">{game.name || "Game"} Configuration</CardTitle>
            <CardDescription className="text-sm">Configure your Satisfactory server</CardDescription>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Server Name */}
        <div className="space-y-2">
          <Label htmlFor="serverName" className="text-sm font-medium">Server Name</Label>
          <Input
            id="serverName"
            value={config.serverName}
            onChange={(e) => handleChange("serverName", e.target.value)}
            className="w-full"
            placeholder="Enter your server name"
          />
        </div>

        {/* Max Players */}
        <div className="space-y-3">
          <Label htmlFor="maxPlayers" className="text-sm font-medium">
            Max Players: <span className="font-semibold">{config.maxPlayers}</span>
          </Label>
          <div className="px-2">
            <Slider
              id="maxPlayers"
              value={[config.maxPlayers]}
              min={1}
              max={16}
              step={1}
              onValueChange={(value) => handleChange("maxPlayers", value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 player</span>
              <span>16 players</span>
            </div>
          </div>
        </div>

        {/* Early Access Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="isEarlyAccess" className="text-sm font-medium cursor-pointer">
              Use Early Access (Experimental)
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable experimental features and latest updates
            </p>
          </div>
          <Switch
            id="isEarlyAccess"
            checked={config.isEarlyAccess}
            onCheckedChange={(checked) => handleChange("isEarlyAccess", checked)}
          />
        </div>
      </div>
    </div>
  )
});
