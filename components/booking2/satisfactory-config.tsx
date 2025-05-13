"use client"

import { useState } from "react"
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
  onBack: () => void
  onSubmit: (config: GameConfig) => void
}

export function SatisfactoryConfigComponent({ onChange, onBack, game, onSubmit }: SatisfactoryConfigProps) {
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

  const handleSubmit = () => {
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
      gameSpecificConfig: {
        ...config,
      },
    }

    // Pass the complete configuration to the parent component
    onSubmit(completeConfig)
  }

  return (
    <div>
      <Card className="p-4">
        <div className="pb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>{game.name || "Game"} Configuration</CardTitle>
              <CardDescription>Configure your Satisfactory server</CardDescription>
            </div>
          </div>
        </div>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serverName">Server Name</Label>
            <Input
              id="serverName"
              value={config.serverName}
              onChange={(e) => handleChange("serverName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max Players: {config.maxPlayers}</Label>
            <Slider
              id="maxPlayers"
              value={[config.maxPlayers]}
              min={1}
              max={16}
              step={1}
              onValueChange={(value) => handleChange("maxPlayers", value[0])}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isEarlyAccess">Use Early Access (Experimental)</Label>
            <Switch
              id="isEarlyAccess"
              checked={config.isEarlyAccess}
              onCheckedChange={(checked) => handleChange("isEarlyAccess", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSubmit}>Continue</Button>
      </div>
    </div>
  )
}
