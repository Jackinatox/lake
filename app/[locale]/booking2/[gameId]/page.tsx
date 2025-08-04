"use client"

import { useState, useEffect, useRef } from "react"
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
import { ArrowLeft, ArrowRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"

export type ServerConfig = {
  hardwareConfig: HardwareConfig
  gameConfig: GameConfig
}

export default function GameServerConfig() {
  const { data: session } = useSession();
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

  const hardwareConfigRef = useRef<any>(null);
  const gameConfigRef = useRef<any>(null);

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
        description: error.toString(),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep = () => {
    if (step === 1 && hardwareConfigRef.current) {
      hardwareConfigRef.current.submit();
    } else if (step === 2 && gameConfigRef.current) {
      gameConfigRef.current.submit();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-primary mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-foreground">
            Loading configuration options...
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Setting up your server configuration
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background -mx-5 -mt-5">
      {/* Header with step indicator - STICKY TO TOP */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="w-full px-4 py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold">Configure Your Server</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Step {step} of 3
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`h-2 flex-1 rounded ${stepNumber === step
                  ? 'bg-primary'
                  : stepNumber < step
                    ? 'bg-primary/60'
                    : 'bg-muted'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content with padding for sticky footer */}
      <div className="w-full px-4 py-6 pb-28 max-w-7xl mx-auto">
        {step === 1 && (
          <div className="bg-card border rounded-lg p-6">
            <HardwareConfigComponent
              ref={hardwareConfigRef}
              diskOptions={diskOptions}
              performanceOptions={performanceGroup}
              onNext={handleHardwareConfigNext}
              initialConfig={hardwareConfig}
            />
          </div>
        )}

        {step === 2 && selectedGame && (
          <div className="bg-card border rounded-lg p-6">
            <GameConfigComponent
              ref={gameConfigRef}
              game={selectedGame}
              onSubmit={handleGameConfigSubmit}
            />
          </div>
        )}

        {step === 3 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">
                Complete Your Payment
              </h2>
              <CustomServerPaymentElements orderId={orderId} />
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom navigation */}
      <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-md border-t p-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {step < 3 && (
              <>
                <>
                  {!session?.user && <div className="flex items-center gap-2 w-full sm:w-auto mb-2 sm:mb-0">
                    <Info className="shrink-0" />
                    <span className="text-sm">
                      Du musst eingeloggt sein für Spiel-speziefischen Konfiguration
                    </span>
                  </div>}
                </>
                <Button
                  onClick={handleNextStep}
                  className="w-full sm:w-auto sm:ml-auto"
                  disabled={!session?.user}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
            {step === 3 && (
              <div className="text-sm text-muted-foreground sm:ml-auto">
                Complete payment above to create your server
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
