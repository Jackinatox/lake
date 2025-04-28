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

interface TerrariaConfigProps {
  onChange: (config: Record<string, any>) => void
}

export function TerrariaConfigComponent({ onChange }: TerrariaConfigProps) {
  const [config, setConfig] = useState({
    serverName: "My Terraria Server",
    maxPlayers: 8,
    worldSize: "medium",
    difficulty: "classic",
    enablePvp: false,
    autoSave: true,
    banlistEnabled: true,
    seed: "",
    password: "",
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
            <span>Advanced Terraria Configuration</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-6 space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="worldSize">World Size</Label>
              <select
                id="worldSize"
                className="w-full p-2 border rounded-md"
                value={config.worldSize}
                onChange={(e) => handleChange("worldSize", e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                className="w-full p-2 border rounded-md"
                value={config.difficulty}
                onChange={(e) => handleChange("difficulty", e.target.value)}
              >
                <option value="classic">Classic</option>
                <option value="expert">Expert</option>
                <option value="master">Master</option>
                <option value="journey">Journey</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seed">World Seed (optional)</Label>
              <Input
                id="seed"
                value={config.seed}
                onChange={(e) => handleChange("seed", e.target.value)}
                placeholder="Leave blank for random"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Server Password (optional)</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Leave blank for no password"
              />
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
              <Label htmlFor="autoSave">Auto Save</Label>
              <Switch
                id="autoSave"
                checked={config.autoSave}
                onCheckedChange={(checked) => handleChange("autoSave", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="banlistEnabled">Enable Banlist</Label>
              <Switch
                id="banlistEnabled"
                checked={config.banlistEnabled}
                onCheckedChange={(checked) => handleChange("banlistEnabled", checked)}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
