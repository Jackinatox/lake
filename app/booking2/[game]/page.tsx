"use client"

import { useState, useEffect } from "react"
import { HardwareConfigComponent } from "@/components/booking2/hardware-config"
import { GameConfigComponent } from "@/components/booking2/game-config"
import { fetchDiskOptions, fetchGames, submitServerConfig, fetchPerformanceGroups } from "@/lib/actions"
import { type CpuType, type RamOption, type DiskOption, type Game, type HardwareConfig, type GameConfig, type ServerConfig, PerformanceGroup } from "@/models/config"
import { useToast } from "@/components/hooks/use-toast"
import { useParams, usePathname } from "next/navigation"


export default function GameServerConfig() {
  const [step, setStep] = useState(1)
  const [performanceGroup, setPerformanceGroup] = useState<PerformanceGroup[]>([]);
  const [diskOptions, setDiskOptions] = useState<DiskOption[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig | null>(null)
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [additionalConfig, setAdditionalConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()


  const params = useParams();
  console.log(params.game);


  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [diskOptionsData, performanceGroupData, games] = await Promise.all([
          fetchDiskOptions(),
          fetchPerformanceGroups(),
          fetchGames()
        ])

        setGames(games);
        setDiskOptions(diskOptionsData);
        setPerformanceGroup(performanceGroupData);
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

  if (loading && performanceGroup.length === 0) {
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
          diskOptions={diskOptions}
          performanceOptions={performanceGroup}
          onNext={handleHardwareConfigNext}
        />
      )}

      {step === 2 && (
        <div>
          <GameConfigComponent
          games={games}
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
