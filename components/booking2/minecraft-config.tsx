"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

interface MinecraftConfigProps {
  onChange: (config: Record<string, any>) => void
}

export function MinecraftConfigComponent({ onChange }: MinecraftConfigProps) {
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
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
    </Collapsible>
  )
}
