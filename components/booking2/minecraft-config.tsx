import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useTranslations } from "next-intl"
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
  onSubmit: (config: GameConfig) => void
}

export const MinecraftConfigComponent = forwardRef(({ onChange, game, onSubmit }: MinecraftConfigProps, ref) => {
  const t = useTranslations("buyGameServer.gameConfig");
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null)
  const [gameVersions, setGameVersions] = useState<any[]>([])
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
        setSelectedVersion(flavor.versions[flavor.versions.length - 1])
        setGameVersions(flavor.versions)
      }
    }
  }, [game])

  useEffect(() => {
    if (selectedFlavorId !== null) {
      const flavor = game.data.flavors.find((f) => f.id === selectedFlavorId)
      if (flavor) {
        setGameVersions(flavor.versions)
        const versionStillExists = flavor.versions.some(
          (v) => v.version === selectedVersion?.version
        );

        if (!versionStillExists) {
          setSelectedVersion(flavor.versions.length > 0 ? flavor.versions[flavor.versions.length - 1] : null);
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
    flavor: "Vanilla",
  })

  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    if (onChange) onChange(newConfig)
  }

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (selectedFlavorId === null || !selectedVersion) {
        console.error("Missing required selection")
        return
      }

      // Create a complete game configuration object
      const completeConfig: GameConfig = {
        gameId: game.id,
        gameType: game.name,
        flavorId: selectedFlavorId,
        eggId: game.data.flavors.find((flavor) => flavor.id === selectedFlavorId)?.egg_id,
        version: selectedVersion.version,
        dockerImage: selectedVersion.docker_image,
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
            <CardTitle className="text-lg sm:text-xl">{t("title", { game: game.name || "Game" })}</CardTitle>
            <CardDescription className="text-sm">{t("description")}</CardDescription>
          </div>
        </div>
      </div>

      {/* Game Flavor Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Game Flavor</Label>
        <Popover open={flavorOpen} onOpenChange={setFlavorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={flavorOpen}
              className="w-full justify-between text-left"
              disabled={loading || game.data.flavors.length === 0}
            >
              <span className="truncate">
                {selectedFlavorId !== null
                  ? game.data.flavors.find((flavor) => flavor.id === selectedFlavorId)?.name || "Select a flavor"
                  : "Select a flavor"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 z-50" align="start">
            <Command>
              <CommandInput placeholder="Search flavor..." className="h-9" />
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
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", selectedFlavorId === flavor.id ? "opacity-100" : "opacity-0")}
                      />
                      <span className="truncate">{flavor.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Game Version Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Game Version</Label>
        <Popover open={versionOpen} onOpenChange={setVersionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={versionOpen}
              className="w-full justify-between text-left"
              disabled={loading || gameVersions.length === 0}
            >
              <span className="truncate">{selectedVersion?.version || "Select a version"}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 z-50" align="start">
            <Command>
              <CommandInput placeholder="Search version..." className="h-9" />
              <CommandList>
                <CommandEmpty>No version found.</CommandEmpty>
                <CommandGroup>
                  {gameVersions.slice().reverse().map((version) => (
                    <CommandItem
                      key={version.version}
                      value={version.version}
                      onSelect={() => {
                        setSelectedVersion(version)
                        setVersionOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", selectedVersion?.version === version.version ? "opacity-100" : "opacity-0")}
                      />
                      <span className="truncate">{version.version}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
});