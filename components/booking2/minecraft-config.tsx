"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowLeft, ChevronDown, ChevronUp, Check, ChevronsUpDown } from "lucide-react"
import type { Game, GameConfig } from "@/models/config"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MinecraftConfigProps {
  onChange: (config: Record<string, any>) => void
  game: Game
  additionalConfig?: Record<string, any>
  onAdditionalConfigChange?: (config: Record<string, any>) => void
  onBack: () => void
  onSubmit: (config: GameConfig) => void
}

export function MinecraftConfigComponent({ onChange, onBack, game, onSubmit }: MinecraftConfigProps) {
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [gameVersions, setGameVersions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [flavorOpen, setFlavorOpen] = useState(false)
  const [versionOpen, setVersionOpen] = useState(false)

  useEffect(() => {
    // Set default flavor to Vanilla (id: 3) if available
    const defaultFlavorId = game.data.flavors.find((f) => f.id === 3)?.id || game.data.flavors[0]?.id || null
    setSelectedFlavorId(defaultFlavorId)

    // Set default version to the first version of the selected flavor
    if (defaultFlavorId !== null) {
      const flavor = game.data.flavors.find((f) => f.id === defaultFlavorId)
      if (flavor && flavor.versions.length > 0) {
        setSelectedVersion(flavor.versions[0])
        setGameVersions(flavor.versions)
      }
    }
  }, [game])

  useEffect(() => {
    if (selectedFlavorId !== null) {
      const flavor = game.data.flavors.find((f) => f.id === selectedFlavorId)
      if (flavor) {
        setGameVersions(flavor.versions)
        // Set default version to the first one in the list if current selection is not available
        if (!flavor.versions.includes(selectedVersion) && flavor.versions.length > 0) {
          setSelectedVersion(flavor.versions[0])
        } else {
          // set
        }
      }
    }
  }, [selectedFlavorId, game.data.flavors, selectedVersion])

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
    if (onChange) onChange(newConfig)
  }

  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = () => {
    if (selectedFlavorId === null || !selectedVersion) {
      console.error("Missing required selection")
      return
    }

    // Create a complete game configuration object
    const completeConfig: GameConfig = {
      gameId: game.id,
      gameType: game.name,
      flavorId: selectedFlavorId,
      version: selectedVersion,
      gameSpecificConfig: {
        ...config,
      },
    }

    // Pass the complete configuration to the parent component
    onSubmit(completeConfig)
  }

  return (
    <>
      <div>
        <Card className="p-4">
          <div className="pb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>{game.name || "Game"} Configuration</CardTitle>
                <CardDescription>Select your preferred game settings</CardDescription>
              </div>
            </div>
          </div>

          {/* Game Flavor Selection with Combobox */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Game Flavor</Label>
            <Popover open={flavorOpen} onOpenChange={setFlavorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={flavorOpen}
                  className="w-full justify-between"
                  disabled={loading || game.data.flavors.length === 0}
                >
                  {selectedFlavorId !== null
                    ? game.data.flavors.find((flavor) => flavor.id === selectedFlavorId)?.name || "Select a flavor"
                    : "Select a flavor"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search flavor..." />
                  <CommandList>
                    <CommandEmpty>No flavor found.</CommandEmpty>
                    <CommandGroup>
                      {game.data.flavors.map((flavor) => (
                        <CommandItem
                          key={flavor.id}
                          value={flavor.name}
                          onSelect={() => {
                            setSelectedFlavorId(flavor.id)
                            setFlavorOpen(false)
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", selectedFlavorId === flavor.id ? "opacity-100" : "opacity-0")}
                          />
                          {flavor.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Game Version Selection with Combobox */}
          <div className="space-y-2 mt-4">
            <Label className="text-sm font-medium">Game Version</Label>
            <Popover open={versionOpen} onOpenChange={setVersionOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={versionOpen}
                  className="w-full justify-between"
                  disabled={loading || gameVersions.length === 0}
                >
                  {selectedVersion || "Select a version"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search version..." />
                  <CommandList>
                    <CommandEmpty>No version found.</CommandEmpty>
                    <CommandGroup>
                      {gameVersions.map((version) => (
                        <CommandItem
                          key={version}
                          value={version}
                          onSelect={() => {
                            setSelectedVersion(version)
                            setVersionOpen(false)
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", selectedVersion === version ? "opacity-100" : "opacity-0")}
                          />
                          {version}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </Card>

        {/* Advanced Config below */}
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

                {/* Difficulty Selection with Combobox */}
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="difficulty" variant="outline" role="combobox" className="w-full justify-between">
                        {config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search difficulty..." />
                        <CommandList>
                          <CommandEmpty>No difficulty found.</CommandEmpty>
                          <CommandGroup>
                            {["peaceful", "easy", "normal", "hard"].map((difficulty) => (
                              <CommandItem
                                key={difficulty}
                                value={difficulty}
                                onSelect={() => handleChange("difficulty", difficulty)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    config.difficulty === difficulty ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} disabled={!selectedFlavorId || !selectedVersion}>
            Continue
          </Button>
        </div>
      </div>
    </>
  )
}
