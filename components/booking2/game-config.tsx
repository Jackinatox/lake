"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import type { Game, GameConfig } from "@/models/config"
import { MinecraftConfigComponent } from "./minecraft-config"
import { SatisfactoryConfigComponent } from "./satisfactory-config"

interface GameConfigProps {
  game: Game
  initialGameId?: number
  additionalConfig?: Record<string, any>
  onAdditionalConfigChange?: (config: Record<string, any>) => void
  onBack: () => void
  onSubmit: (config: GameConfig) => void
}

export function GameConfigComponent({
  game,
  initialGameId,
  additionalConfig = {},
  onAdditionalConfigChange = () => { },
  onBack,
  onSubmit,
}: GameConfigProps) {
  const [gameConfig, setGameConfig] = useState<Record<string, any>>({})

  const handleConfigChange = (config: Record<string, any>) => {
    setGameConfig(config)
    onAdditionalConfigChange(config)
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="p-4">
        {(() => {
          switch (game.id) {
            case 1: // Minecraft
              return (
                <MinecraftConfigComponent
                  onChange={handleConfigChange}
                  onSubmit={onSubmit}
                  game={game}
                  onBack={onBack}
                />
              )
            case 2: // Satisfactory
              return (
                <SatisfactoryConfigComponent
                  onChange={handleConfigChange}
                  onSubmit={onSubmit}
                  game={game}
                  onBack={onBack}
                />
              )
            default:
              return (
                <div className="p-4 border rounded-md">
                  <p className="text-muted-foreground">No specific configuration options available for this game.</p>
                </div>
              )
          }
        })()}
      </Card>
    </div>
  )
}
