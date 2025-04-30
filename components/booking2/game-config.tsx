"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import type { Game, GameFlavor, GameVersion, GameConfig } from "@/models/config"
import { fetchGameFlavors, fetchGameVersions } from "@/lib/actions"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { MinecraftConfigComponent } from "./minecraft-config"
import { TerrariaConfigComponent } from "./terraria-config"

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
  const [selectedGameId, setSelectedGameId] = useState<number | null>(initialGameId || null)
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null)
  const [gameVersions, setGameVersions] = useState<GameVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)


  // Fetch game versions when flavor changes
  useEffect(() => {
    if (selectedFlavorId) {
      setLoading(true)
      fetchGameVersions(selectedFlavorId)
        .then((data) => {
          setGameVersions(data)
          setSelectedVersionId(data.length > 0 ? data[0].id : null)
        })
        .catch((error) => console.error("Error fetching game versions:", error))
        .finally(() => setLoading(false))
    }
  }, [selectedFlavorId])

  const handleMinecraftConfigChange = (key: string, value: any) => {
    const newConfig = { ...additionalConfig, [key]: value }
    onAdditionalConfigChange(newConfig)
  }

  const handleSubmit = () => {
    if (!selectedGameId || !selectedFlavorId || !selectedVersionId) return

    const config: GameConfig = {
      gameId: selectedGameId,
      gameFlavorId: selectedFlavorId,
      gameVersionId: selectedVersionId,
      additionalConfig: additionalConfig, // Use the passed additionalConfig
    }

    onSubmit(config)
  }

  const handleConfigChange = (config: Record<string, any>) => {
    setGameConfig(config)
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="p-4">
        {(() => {
          switch (game.id) {
            case 1: // Minecraft
              return <MinecraftConfigComponent onChange={handleConfigChange} />
            case 2: // Terraria
              return <TerrariaConfigComponent onChange={handleConfigChange} />
            default:
              return (
                <div className="p-4 border rounded-md">
                  <p className="text-muted-foreground">No specific configuration optionggs available for this game.</p>
                </div>
              )
          }
        })()}
        <div className="w-full mx-auto mt-4 flex justify-end">
          <Button onClick={handleSubmit} disabled={!selectedVersionId}>
            Launch Server
          </Button>
        </div>
      </Card>
    </div>
  )
}
