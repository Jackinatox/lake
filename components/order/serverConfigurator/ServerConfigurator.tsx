"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, HelpCircle } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { CustomSlider } from "@/components/general/CustomSlider"

export default function ServerConfigurator() {
  const [cpuCores, setCpuCores] = useState(4)
  const [ramSize, setRamSize] = useState(2)
  const [totalPrice, setTotalPrice] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState("besser")

  const ramSteps = ["1GB", "6.5GB", "12GB"];
  const CPUSteps = ["1", "6.5", "12"];

  // Calculate price based on current configuration
  useEffect(() => {
    const cpuPrice = cpuCores * 0.4 // 0,1€ per core
    const ramPrice = ramSize * 0.5 // 0,2€ per GiB
    const basePrice = 5 // Base price
    setTotalPrice(basePrice + cpuPrice + ramPrice)
  }, [cpuCores, ramSize, selectedPlan])

  return (
    <div className="w-full mx-auto border border-gray-300 rounded-lg shadow-sm">

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">Performance</h2>
        </div>

        {/* Plan Selection Tabs */}
        <Tabs defaultValue={selectedPlan} onValueChange={setSelectedPlan} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12 rounded-full p-1">
            <TabsTrigger value="gut" className="rounded-full">
              Gut
            </TabsTrigger>
            <TabsTrigger value="besser" className="rounded-full">
              Besser
            </TabsTrigger>
            <TabsTrigger value="am-besten" className="rounded-full">
              Am Besten
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* CPU Configuration */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">CPU</h3>
              <span className="text-sm text-gray-500">(Modelle)</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm font-medium text-gray-600">0,4€/Kern</div>
          </div>
          <div className="flex items-center gap-4">

            <div className="w-full">
              <Slider defaultValue={[1]} min={1} max={12} step={1} onValueChange={(e) => setCpuCores(e[0])} />
              <div className="mt-2 -mx-1.5 flex items-center justify-between text-muted-foreground text-xs">
                {CPUSteps.map((expansion) => (
                  <span key={expansion}>{expansion}</span>
                ))}
              </div>
            </div>

            <span className="min-w-12 text-right">{cpuCores}</span>
          </div>
        </div>

        {/* RAM Configuration */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">RAM</h3>
              <span className="text-sm text-gray-500">(Geschwindigkeit)</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm font-medium text-gray-600">0,5€/GiB</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-full">
              <Slider defaultValue={[2]} max={12} step={0.5} min={1} onValueChange={(value) => setRamSize(value[0])} />
              <div className="mt-2 -mx-1.5 flex items-center justify-between text-muted-foreground text-xs">
                {ramSteps.map((expansion) => (
                  <span key={expansion}>{expansion}</span>
                ))}
              </div>
            </div>
            <span className="min-w-12 text-right">{ramSize}</span>
          </div>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 flex items-center justify-center h-24 cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="font-medium text-lg">Disk</span>
          </Card>
          <Card className="p-4 flex items-center justify-center h-24 cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="font-medium text-lg">Backups</span>
          </Card>
          <Card className="p-4 flex items-center justify-center h-24 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="text-center">
              <div className="font-medium">Preis:</div>
              <div className="text-xl font-bold">{totalPrice.toFixed(2)} €</div>
            </div>
          </Card>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-4 mt-8">
          <Button variant="outline" size="lg" disabled className="flex-1 h-16 text-lg border-gray-300">
            Advanced
          </Button>
          <Button variant="outline" size="sm" className="w-2/12 h-16 border-dashed border-gray-300 flex-none px-3">
            <span className="text-sm">Mehr Info</span>
          </Button>

          <Button variant="default" size="lg" className="flex-1 gap-2 h-16 text-lg">
            Weiter
          </Button>
        </div>
      </div>
    </div>
  )
}

