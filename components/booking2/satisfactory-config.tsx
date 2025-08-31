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
    version: "experimental",
  })

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    if (onChange) onChange(newConfig)
  }
game.data

  useImperativeHandle(ref, () => ({
    submit: () => {
      // For Satisfactory, we just need an environment variable to switch between early access and production
      const envVars = {
        SATISFACTORY_EXPERIMENTAL: config.version === "experimental" ? "true" : "false",
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
            checked={config.version === "experimental"}
            onCheckedChange={(checked) => handleChange("version", checked ? "experimental" : "release")}
          />
        </div>
      </div>
    </div>
  )
});
