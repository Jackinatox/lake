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

interface GameConfigProps {
  games: Game[]
  initialGameId?: number
  additionalConfig?: Record<string, any>
  onAdditionalConfigChange?: (config: Record<string, any>) => void
  onBack: () => void
  onSubmit: (config: GameConfig) => void
}

export function GameConfigComponent({
  games,
  initialGameId,
  additionalConfig = {},
  onAdditionalConfigChange = () => {},
  onBack,
  onSubmit,
}: GameConfigProps) {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(initialGameId || null)
  const [gameFlavors, setGameFlavors] = useState<GameFlavor[]>([])
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null)
  const [gameVersions, setGameVersions] = useState<GameVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Set initial game if provided
  useEffect(() => {
    if (games.length > 0 && !selectedGameId) {
      setSelectedGameId(initialGameId || games[0].id)
    }
  }, [games, initialGameId, selectedGameId])

  // Fetch game flavors when game changes
  useEffect(() => {
    if (selectedGameId) {
      setLoading(true)
      fetchGameFlavors(selectedGameId)
        .then((data) => {
          setGameFlavors(data)
          setSelectedFlavorId(data.length > 0 ? data[0].id : null)
        })
        .catch((error) => console.error("Error fetching game flavors:", error))
        .finally(() => setLoading(false))
    }
  }, [selectedGameId])

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

  const selectedGame = games.find((game) => game.id === selectedGameId)

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>{selectedGame?.name || "Game"} Configuration</CardTitle>
              <CardDescription>Select your preferred game settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Game</label>
            <Select
              value={selectedGameId?.toString() || ""}
              onValueChange={(value) => setSelectedGameId(Number.parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id.toString()}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Game Flavor Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Game Flavor</label>
            <Select
              value={selectedFlavorId?.toString() || ""}
              onValueChange={(value) => setSelectedFlavorId(Number.parseInt(value))}
              disabled={loading || gameFlavors.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a flavor" />
              </SelectTrigger>
              <SelectContent>
                {gameFlavors.map((flavor) => (
                  <SelectItem key={flavor.id} value={flavor.id.toString()}>
                    {flavor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Game Version Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Game Version</label>
            <Select
              value={selectedVersionId?.toString() || ""}
              onValueChange={(value) => setSelectedVersionId(Number.parseInt(value))}
              disabled={loading || gameVersions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a version" />
              </SelectTrigger>
              <SelectContent>
                {gameVersions.map((version) => (
                  <SelectItem key={version.id} value={version.id.toString()}>
                    {version.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        {selectedGameId === 1 && ( // Minecraft-specific settings
          <div className="px-6 pb-4">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <div className="flex items-center justify-between space-x-4 px-1">
                <h4 className="text-sm font-semibold">Advanced Minecraft Configuration</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="mt-2">
                <div className="space-y-4 border p-4 rounded-md">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Server Name (MOTD)</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="A Minecraft Server"
                      value={additionalConfig.serverName || "A Minecraft Server"}
                      onChange={(e) => handleMinecraftConfigChange("serverName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Players</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md"
                      placeholder="20"
                      min="1"
                      max="100"
                      value={additionalConfig.maxPlayers || 20}
                      onChange={(e) => handleMinecraftConfigChange("maxPlayers", Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={additionalConfig.difficulty || "normal"}
                      onChange={(e) => handleMinecraftConfigChange("difficulty", e.target.value)}
                    >
                      <option value="peaceful">Peaceful</option>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pvp"
                      checked={additionalConfig.enablePvp || false}
                      onChange={(e) => handleMinecraftConfigChange("enablePvp", e.target.checked)}
                    />
                    <label htmlFor="pvp" className="text-sm font-medium">
                      Enable PvP
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="commandBlocks"
                      checked={additionalConfig.enableCommandBlocks || false}
                      onChange={(e) => handleMinecraftConfigChange("enableCommandBlocks", e.target.checked)}
                    />
                    <label htmlFor="commandBlocks" className="text-sm font-medium">
                      Enable Command Blocks
                    </label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
        <CardFooter className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!selectedVersionId}>
            Launch Server
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
