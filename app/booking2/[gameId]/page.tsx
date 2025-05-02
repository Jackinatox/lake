"use client"

import { useState, useEffect } from "react"
import { HardwareConfigComponent } from "@/components/booking2/hardware-config"
import { GameConfigComponent } from "@/components/booking2/game-config"
import { fetchDiskOptions, fetchGames, submitServerConfig, fetchPerformanceGroups } from "@/lib/actions"
import type { DiskOption, Game, HardwareConfig, GameConfig, PerformanceGroup } from "@/models/config"
import { useToast } from "@/components/hooks/use-toast"
import { useParams } from "next/navigation"

export default function GameServerConfig() {
  const [step, setStep] = useState(1)
  const [performanceGroup, setPerformanceGroup] = useState<PerformanceGroup[]>([])
  const [diskOptions, setDiskOptions] = useState<DiskOption[]>([])
  const [selectedGame, setSelectedGame] = useState<Game>()
  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const params = useParams()
  const gameId = Number.parseInt(params.gameId.toString(), 10)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("before fetching id: ", gameId)
        const [diskOptionsData, performanceGroupData, games] = await Promise.all([
          fetchDiskOptions(),
          fetchPerformanceGroups(),
          fetchGames(gameId),
        ])

        setSelectedGame(games)
        setDiskOptions(diskOptionsData)
        setPerformanceGroup(performanceGroupData)
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
  }, [toast, gameId])

  const handleHardwareConfigNext = (config: HardwareConfig) => {
    setHardwareConfig(config)
    setStep(2)
  }

  const handleGameConfigBack = () => {
    setStep(1)
  }

  const handleGameConfigSubmit = async (gameConfig: GameConfig) => {
    if (!hardwareConfig) return

    console.log('config: ', gameConfig)
    return

    // Create the final server configuration
    const serverConfig = {
      hardwareConfig,
      gameConfig,
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

      {step === 2 && selectedGame && (
        <div className="">
          <GameConfigComponent game={selectedGame} onBack={handleGameConfigBack} onSubmit={handleGameConfigSubmit} />
        </div>
      )}
    </div>
  )
}
