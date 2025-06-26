"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info } from "lucide-react"
import type { HardwareConfig } from "@/models/config"
import { calcDiskSize } from "@/lib/globalFunctions"
import { Prisma } from "@prisma/client"
import { PerformanceGroup } from "@/models/prisma"

interface HardwareConfigProps {
  diskOptions: { id: number; size_gb: number; price_per_gb: number }[]
  performanceOptions: PerformanceGroup[]
  onNext: (config: HardwareConfig) => void
  initialConfig: HardwareConfig | null
}

export function HardwareConfigComponent({ diskOptions, initialConfig, performanceOptions, onNext }: HardwareConfigProps) {
  const [selectedPFGroup, setSelectedPFGroup] = useState<PerformanceGroup>(null);

  const [cpuCores, setCpuCores] = useState(1)
  const [ramGb, setRamGb] = useState(1)
  const [totalPrice, setTotalPrice] = useState(0)

  // Set initial values
  useEffect(() => {
    if (performanceOptions.length > 0 && !selectedPFGroup) {
      setSelectedPFGroup(performanceOptions[0])
    }
  }, [performanceOptions])

  useEffect(() => {
    if (initialConfig && performanceOptions.length > 0) {
      const group = performanceOptions.find(pf => pf.id === initialConfig.pfGroupId)
      if (group) {
        setSelectedPFGroup(group)
        setCpuCores(initialConfig.cpuCores)
        setRamGb(initialConfig.ramGb)
      }
    }
  }, [initialConfig, performanceOptions])


  // Calculate total price whenever configuration changes
  useEffect(() => {
    if (selectedPFGroup?.cpu && selectedPFGroup?.ram) {
      const cpuPrice = selectedPFGroup.cpu.pricePerCore * cpuCores
      const ramPrice = selectedPFGroup.ram.pricePerGb * ramGb

      setTotalPrice(Number.parseFloat((cpuPrice + ramPrice).toFixed(2)))
    }
  }, [selectedPFGroup, cpuCores, ramGb])

  const handleNext = () => {
    if (!selectedPFGroup?.cpu) return

    const config: HardwareConfig = {
      pfGroupId: selectedPFGroup.id,
      cpuCores,
      ramGb,
      diskMb: calcDiskSize(cpuCores * 100, ramGb * 1024)
    }

    onNext(config)
  }

  if (!selectedPFGroup) {
    return <div>Loading configuration options...</div>
  }

  const ramOption = selectedPFGroup.ram;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Configure your server hardware</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CPU Selection */}
          <div>
            <Tabs
              value={selectedPFGroup.id.toString()}
              onValueChange={(value) => {
                const pfGroup = performanceOptions.find((pf) => pf.id.toString() === value);
                if (pfGroup) { 
                  setSelectedPFGroup(pfGroup); 
                  setCpuCores(Math.min(cpuCores, pfGroup.cpu.maxThreads)) 
                }
              }}>
              <TabsList className={`grid grid-cols-${performanceOptions.length} w-full`}>
                {performanceOptions.map((pf) => (
                  <TabsTrigger key={pf.id} value={pf.id.toString()}>{pf.name}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* CPU Cores */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="text-right font-semibold">{cpuCores}</div>
                <h3 className="text-lg font-semibold">vCore(s)</h3>
                <span className="text-muted-foreground">{selectedPFGroup.cpu.name}</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-right text-muted-foreground">{selectedPFGroup.cpu.pricePerCore.toFixed(2)}€/vCore</div>
            </div>
            <Slider
              value={[cpuCores]}
              min={selectedPFGroup.cpu.minThreads}
              max={selectedPFGroup.cpu.maxThreads}
              step={1}
              onValueChange={(value) => setCpuCores(value[0])}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{selectedPFGroup.cpu.minThreads}</span>
              <span>{Math.floor((selectedPFGroup.cpu.minThreads + selectedPFGroup.cpu.maxThreads) / 2)}</span>
              <span>{selectedPFGroup.cpu.maxThreads}</span>
            </div>
          </div>

          {/* RAM */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="text-right font-semibold">{ramGb} GiB</div>
                <h3 className="text-lg font-semibold">RAM</h3>
              </div>
              <div className="text-right text-muted-foreground">{ramOption.pricePerGb.toFixed(2)}€/GiB</div>
            </div>
            <Slider
              value={[ramGb]}
              min={ramOption.minGb}
              max={ramOption.maxGb}
              step={1}
              onValueChange={(value) => setRamGb(value[0])}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{ramOption.minGb}GB</span>
              <span>{Math.floor((ramOption.minGb + ramOption.maxGb) / 2)}GB</span>
              <span>{ramOption.maxGb}GB</span>
            </div>
            <div className="text-right font-semibold">3 €</div>
          </div>

          {/* Price Summary */}
          <div className="grid grid-cols-2 w-full gap-3">
            <Card>
              <CardContent className="p-4 text-center flex justify-between">
                <span className="font-semibold">Disk: </span>
                <span className="font-semibold">{calcDiskSize(cpuCores * 100, ramGb * 1024) / 1024} GB</span>
              </CardContent>
            </Card>
            <Card className="bg-muted/40">
              <CardContent className="p-4 flex justify-between items-center">
                <span className="font-semibold">Price:</span>
                <span className="text-xl font-bold">{totalPrice.toFixed(2)} €</span>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Advanced</Button>
          <Button onClick={handleNext}>Continue</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
