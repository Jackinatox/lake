"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Game, GameConfig } from "@/models/config"

interface MinecraftConfigProps {
  onChange: (config: Record<string, any>) => void
    game: Game
    additionalConfig?: Record<string, any>
    onAdditionalConfigChange?: (config: Record<string, any>) => void
    onBack: () => void
    onSubmit: (config: GameConfig) => void
}

export function MinecraftConfigComponent({ onChange, onBack, game }: MinecraftConfigProps) {
    const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null)
    const [gameVersions, setGameVersions] = useState<[]>([])
    const [loading, setLoading] = useState(false)
    
  const [config, setConfig] = useState({
    serverName: "My Minecraft Server",
    maxPlayers: 20,
    viewDistance: 10,
    difficulty: "normal",
    enablePvp: true,
    enableNether: true,
    enableCommandBlocks: true,
    spawnProtection: 16,
    allowFlight: false,
  })

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onChange(newConfig)
  }

  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div>
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
                {game.data.flavours.map((flavor) => (
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
        </Card>



        {/* Advanced Config below */}

        <div Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4" >
          <Card>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex w-full justify-between p-4">
                <span>Advanced Minecraft Configuration</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serverName">Server Name (MOTD)</Label>
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
                    max={100}
                    step={1}
                    onValueChange={(value) => handleChange("maxPlayers", value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="viewDistance">View Distance: {config.viewDistance}</Label>
                  <Slider
                    id="viewDistance"
                    value={[config.viewDistance]}
                    min={3}
                    max={32}
                    step={1}
                    onValueChange={(value) => handleChange("viewDistance", value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    className="w-full p-2 border rounded-md"
                    value={config.difficulty}
                    onChange={(e) => handleChange("difficulty", e.target.value)}
                  >
                    <option value="peaceful">Peaceful</option>
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enablePvp">Enable PvP</Label>
                  <Switch
                    id="enablePvp"
                    checked={config.enablePvp}
                    onCheckedChange={(checked) => handleChange("enablePvp", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableNether">Enable Nether</Label>
                  <Switch
                    id="enableNether"
                    checked={config.enableNether}
                    onCheckedChange={(checked) => handleChange("enableNether", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableCommandBlocks">Enable Command Blocks</Label>
                  <Switch
                    id="enableCommandBlocks"
                    checked={config.enableCommandBlocks}
                    onCheckedChange={(checked) => handleChange("enableCommandBlocks", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowFlight">Allow Flight</Label>
                  <Switch
                    id="allowFlight"
                    checked={config.allowFlight}
                    onCheckedChange={(checked) => handleChange("allowFlight", checked)}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </div>
      </div>
    </>
  )
}
