"use client"

import { forwardRef, useImperativeHandle, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Game, GameConfig } from "@/models/config"
import { SatisfactoryConfig } from "@/models/gameSpecificConfig/SatisfactoryConfig"

interface SatisfactoryConfigProps {
  onChange: (config: SatisfactoryConfig) => void
  game: Game
  onSubmit: (config: GameConfig) => void
}

export const SatisfactoryConfigComponent = forwardRef(({ onChange, game, onSubmit }: SatisfactoryConfigProps, ref) => {
  const t = useTranslations("buyGameServer.gameConfig");
  console.log("game:", game)
  const [config, setConfig] = useState<SatisfactoryConfig>({
    version: "experimental",
    max_players: 8,
    num_autosaves: 4,
    upload_crash_report: true,
    autosave_interval: 300,
  })

  const handleChange = <K extends keyof SatisfactoryConfig>(
    key: K,
    value: SatisfactoryConfig[K]) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    if (onChange) onChange(newConfig)
  }
  // Note: removed stray expression that caused a syntax error

  useImperativeHandle(ref, () => ({
    submit: () => {
      // Create a complete game configuration object
      const completeConfig: GameConfig = {
        gameId: game.id,
        gameType: game.name,
        eggId: game.data.egg_id,
        flavorId: 1, // Assuming there's only one flavor for Satisfactory
        version: "latest", // Assuming we always use the latest version
        dockerImage: game.data.docker_image,
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

      <div className="space-y-4 sm:space-y-6">
        {/* Early Access Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="isEarlyAccess" className="text-sm font-medium cursor-pointer">
              Use Early Access (Experimental)
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable experimental features and latest updates
            </p>
          </div>
          <Switch
            id="isEarlyAccess"
            checked={config.version === "experimental"}
            onCheckedChange={(checked) => handleChange("version", checked ? "experimental" : "release")}
          />
        </div>

        {/* MAX_PLAYERS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="maxPlayers" className="text-sm font-medium cursor-pointer">
              Max Players
            </Label>
            <p className="text-xs text-muted-foreground">Maximum number of concurrent players</p>
          </div>
          <Input
            id="maxPlayers"
            type="number"
            min={1}
            max={64}
            value={config.max_players ?? 8}
            onChange={(e) => handleChange("max_players", Math.max(1, Math.min(64, Number(e.target.value) || 0)))}
            className="w-40"
          />
        </div>

        {/* NUM_AUTOSAVES */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="numAutosaves" className="text-sm font-medium cursor-pointer">
              Number of Autosaves
            </Label>
            <p className="text-xs text-muted-foreground">How many autosave files to keep</p>
          </div>
          <Input
            id="numAutosaves"
            type="number"
            min={1}
            max={100}
            value={config.num_autosaves ?? 4}
            onChange={(e) => handleChange("num_autosaves", Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
            className="w-40"
          />
        </div>

        {/* AUTOSAVE_INTERVAL */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="autosaveInterval" className="text-sm font-medium cursor-pointer">
              Autosave Interval (seconds)
            </Label>
            <p className="text-xs text-muted-foreground">Time between autosaves</p>
          </div>
          <Input
            id="autosaveInterval"
            type="number"
            min={60}
            max={3600}
            step={30}
            value={config.autosave_interval ?? 300}
            onChange={(e) => handleChange("autosave_interval", Math.max(60, Math.min(3600, Number(e.target.value) || 0)))}
            className="w-40"
          />
        </div>

        {/* UPLOAD_CRASH_REPORT */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="uploadCrashReport" className="text-sm font-medium cursor-pointer">
              Upload Crash Reports
            </Label>
            <p className="text-xs text-muted-foreground">Enable sending crash reports (0/1)</p>
          </div>
          <Switch
            id="uploadCrashReport"
            checked={(config.upload_crash_report ?? 1) === 1}
            onCheckedChange={(checked) => handleChange("upload_crash_report", checked)}
          />
        </div>
      </div>
    </div>
  )
});
