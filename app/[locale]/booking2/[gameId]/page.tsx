"use client"

import { useState, useEffect } from "react"
import { HardwareConfigComponent } from "@/components/booking2/hardware-config"
import { GameConfigComponent } from "@/components/booking2/game-config"
import { fetchGames, fetchPerformanceGroups } from "@/lib/actions"
import type { DiskOption, Game, HardwareConfig, GameConfig } from "@/models/config"
import { useToast } from "@/components/hooks/use-toast"
import { useParams } from "next/navigation"
import { useRouter } from "next/navigation"
// import { bookServer } from "./bokkServer-action"
import { Prisma } from "@prisma/client"
import { PerformanceGroup } from "@/models/prisma"
import { createServerOrder } from "./actions"
import CustomServerPaymentElements from "@/components/payments/PaymentElements"

export type ServerConfig = {
  hardwareConfig: HardwareConfig
  gameConfig: GameConfig
}



export default function GameServerConfig() {
  const [orderId, setOrderId] = useState('');
  const [step, setStep] = useState(1)
  const [performanceGroup, setPerformanceGroup] = useState<PerformanceGroup[]>([])
  const [diskOptions, setDiskOptions] = useState<DiskOption[]>([])
  const [selectedGame, setSelectedGame] = useState<Game>()
  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const params = useParams()
  const router = useRouter();
  const gameId = Number.parseInt(params.gameId.toString(), 10)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [performanceGroupData, games] = await Promise.all([
          fetchPerformanceGroups(),
          fetchGames(gameId),
        ])

        if (!games) router.replace('/products/gameserver')

        setSelectedGame(games)
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

    // Create the final server configuration

    const serverConfig: ServerConfig = {
      hardwareConfig,
      gameConfig,
    }

    try {
      setLoading(true)
      // Redirect to payment but i need to save the server config???

      const newId = await createServerOrder(serverConfig);
      setOrderId(newId)

      setStep(3);


      toast({
        title: "Success",
        description: `OrderID: ${newId}`,
      })
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

  if (loading) {
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
      <div className={step === 1 ? "block" : "hidden"}>
        <HardwareConfigComponent
          diskOptions={diskOptions}
          performanceOptions={performanceGroup}
          onNext={handleHardwareConfigNext}
          initialConfig={hardwareConfig}
        />
      </div>


      <div className={step === 2 ? "block" : "hidden"}>
        {selectedGame && (
          <GameConfigComponent
            game={selectedGame}
            onBack={handleGameConfigBack}
            onSubmit={handleGameConfigSubmit}
          />
        )}
      </div>

      <div className={step === 3 ? "block" : "hidden"}>
        {selectedGame && (
          <>
            <div> Payment </div>

            <CustomServerPaymentElements orderId={orderId} />
          </>
        )}
      </div>

    </div>
  )
}
