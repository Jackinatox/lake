"use client"

import { useState, useEffect } from "react"
import { MinecraftConfigComponent } from "./minecraft-config"
import { TerrariaConfigComponent } from "./terraria-config"

interface GameConfigFactoryProps {
  gameId: number
  onChange: (config: Record<string, any>) => void
}

export function GameConfigFactory({ gameId, onChange }: GameConfigFactoryProps) {
  const [gameConfig, setGameConfig] = useState<Record<string, any>>({})

  // Update parent component when config changes
  useEffect(() => {
    onChange(gameConfig)
  }, [gameConfig, onChange])

  const handleConfigChange = (config: Record<string, any>) => {
    setGameConfig(config)
  }

  // Render the appropriate game config component based on gameId
  switch (gameId) {
    case 1: // Minecraft
      return <MinecraftConfigComponent onChange={handleConfigChange} />
    case 2: // Terraria
      return <TerrariaConfigComponent onChange={handleConfigChange} />
    default:
      return (
        <div className="p-4 border rounded-md mt-4">
          <p className="text-muted-foreground">No specific configuration options available for this game.</p>
        </div>
      )
  }
}
