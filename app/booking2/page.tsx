"use client"

import { useState, useEffect } from "react"
import { HardwareConfigComponent } from "@/components/booking2/hardware-config"
import { GameConfigComponent } from "@/components/booking2/game-config"
import { fetchCpuTypes, fetchRamOptions, fetchDiskOptions, fetchGames, submitServerConfig } from "@/lib/actions"
import type { CpuType, RamOption, DiskOption, Game, HardwareConfig, GameConfig, ServerConfig } from "@/models/config"
import { useToast } from "@/components/hooks/use-toast"

export default function GameServerConfig() {
  const [step, setStep] = useState(1)
  const [cpuTypes, setCpuTypes] = useState<CpuType[]>([])
  const [ramOptions, setRamOptions] = useState<RamOption[]>([])
  const [diskOptions, setDiskOptions] = useState<DiskOption[]>([])
  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig | null>(null)
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [additionalConfig, setAdditionalConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cpuTypesData, ramOptionsData, diskOptionsData] = await Promise.all([
          fetchCpuTypes(),
          fetchRamOptions(),
          fetchDiskOptions(),
        ])

        setCpuTypes(cpuTypesData)
        setRamOptions(ramOptionsData)
        setDiskOptions(diskOptionsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load configuration options",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleHardwareConfigNext = (config: HardwareConfig) => {
    setHardwareConfig(config)
    setStep(2)
  }

  const handleGameConfigBack = () => {
    setStep(1)
  }

  const handleAdditionalConfigChange = (config: Record<string, any>) => {
    setAdditionalConfig(config)
  }

  const handleGameConfigSubmit = async (config: GameConfig) => {
    if (!hardwareConfig) return

    // Merge the additional config with the game config
    const finalGameConfig: GameConfig = {
      ...config,
      additionalConfig,
    }

    setGameConfig(finalGameConfig)

    // Create the final server configuration
    const serverConfig: ServerConfig = {
      hardwareConfig,
      gameConfig: finalGameConfig,
    }

    try {
      setLoading(true)
      const result = await submitServerConfig(serverConfig)

      toast({
        title: "Success",
        description: "Server configuration submitted successfully",
      })

      // In a real application, you might redirect to a deployment status page
      console.log("Server configuration submitted:", result)
    } catch (error) {
      console.error("Error submitting server configuration:", error)
      toast({
        title: "Error",
        description: "Failed to submit server configuration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && cpuTypes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading configuration options...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {step === 1 && (
        <HardwareConfigComponent
          cpuTypes={cpuTypes}
          ramOptions={ramOptions}
          diskOptions={diskOptions}
          onNext={handleHardwareConfigNext}
        />
      )}

      {step === 2 && (
        <div>
          <GameConfigComponent
            onBack={handleGameConfigBack}
            onSubmit={handleGameConfigSubmit}
            additionalConfig={additionalConfig}
            onAdditionalConfigChange={handleAdditionalConfigChange}
          />

          {/* Remove this section
          {gameConfig ? (
            <GameConfigFactory gameId={gameConfig.gameId} onChange={handleAdditionalConfigChange} />
          ) : (
            games.length > 0 && <GameConfigFactory gameId={games[0].id} onChange={handleAdditionalConfigChange} />
          )}
          */}
        </div>
      )}
    </div>
  )
}
