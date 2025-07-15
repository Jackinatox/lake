"use client"

import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import type { Game, GameConfig } from "@/models/config"
import { MinecraftConfigComponent } from "./minecraft-config"
import { SatisfactoryConfigComponent } from "./satisfactory-config"

interface GameConfigProps {
  game: Game
  initialGameId?: number
  additionalConfig?: Record<string, any>
  onAdditionalConfigChange?: (config: Record<string, any>) => void
  onSubmit: (config: GameConfig) => void
}

export const GameConfigComponent = forwardRef((
  {
    game,
    initialGameId,
    additionalConfig = {},
    onAdditionalConfigChange = () => { },
    onSubmit,
  }: GameConfigProps,
  ref
) => {
  const [gameConfig, setGameConfig] = useState<Record<string, any>>({})
  const configRef = useRef<any>(null);

  const handleConfigChange = (config: Record<string, any>) => {
    setGameConfig(config)
    onAdditionalConfigChange(config)
  }

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (configRef.current) {
        configRef.current.submit();
      }
    }
  }));

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="p-4">
        {(() => {
          switch (game.id) {
            case 1: // Minecraft
              return (
                <MinecraftConfigComponent
                  ref={configRef}
                  onChange={handleConfigChange}
                  onSubmit={onSubmit}
                  game={game}
                />
              )
            case 2: // Satisfactory
              return (
                <SatisfactoryConfigComponent
                  ref={configRef}
                  onChange={handleConfigChange}
                  onSubmit={onSubmit}
                  game={game}
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
});
