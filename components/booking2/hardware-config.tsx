"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info } from "lucide-react"
import type { CpuType, RamOption, DiskOption, HardwareConfig, PerformanceGroup } from "@/models/config"
import { TabList } from "@mui/joy"

interface HardwareConfigProps {
  ramOptions: RamOption[]
  diskOptions: DiskOption[]
  performanceOptions: PerformanceGroup[]
  onNext: (config: HardwareConfig) => void
}

export function HardwareConfigComponent({ ramOptions, diskOptions, performanceOptions, onNext }: HardwareConfigProps) {
  // const [selectedCpuType, setSelectedCpuType] = useState<CpuType | null>(null)
  const [selectedPFGroup, setSelectedPFGroup] = useState<PerformanceGroup | null>(null);
  const [cpuCores, setCpuCores] = useState(1)
  const [ramGb, setRamGb] = useState(1)
  const [selectedDiskOption, setSelectedDiskOption] = useState<DiskOption | null>(null)
  const [totalPrice, setTotalPrice] = useState(0)

  // Set initial values
  useEffect(() => {
    if (performanceOptions.length > 0 && !selectedPFGroup) {
      console.log('setting defaul')
      setSelectedPFGroup(performanceOptions[0])
    }

    if (diskOptions.length > 0 && !selectedDiskOption) {
      setSelectedDiskOption(diskOptions[0])
    }
  }, [performanceOptions, diskOptions,])

  // Calculate total price whenever configuration changes
  useEffect(() => {
    if (selectedPFGroup?.CPU && ramOptions.length > 0 && selectedDiskOption) {
      const cpuPrice = selectedPFGroup.CPU.price_per_core * cpuCores
      const ramPrice = ramOptions[0].price_per_gb * ramGb
      const diskPrice = selectedDiskOption.price_per_gb * selectedDiskOption.size_gb

      setTotalPrice(Number.parseFloat((cpuPrice + ramPrice + diskPrice).toFixed(2)))
    }
  }, [selectedPFGroup, cpuCores, ramGb, selectedDiskOption, ramOptions])

  const handleNext = () => {
    if (!selectedPFGroup.CPU || !selectedDiskOption) return

    const config: HardwareConfig = {
      pfGroupId: selectedPFGroup.id,
      cpuCores,
      ramGb,
      diskGb: selectedDiskOption.size_gb,
      totalPrice,
    }

    onNext(config)
  }

  if (!selectedPFGroup || ramOptions.length === 0 || !selectedDiskOption) {
    return <div>Loading configuration options...</div>
  }

  const ramOption = ramOptions[0] // Using the first RAM option

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Configure your server hardware</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CPU Selection */}
          {/* <div>
            <Tabs
              defaultValue={selectedCpuType.id.toString()}
              onValueChange={(value) => {
                const cpuType = cpuTypes.find((cpu) => cpu.id.toString() === value)
                if (cpuType) setSelectedCpuType(cpuType)
              }}
            >
              <TabsList className={`grid grid-cols-${Math.min(cpuTypes.length, 4)} w-full`}>
                {cpuTypes.map((cpu) => (
                  <TabsTrigger key={cpu.id} value={cpu.id.toString()}>
                    {cpu.Name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div> */}
          <div>
            <Tabs
              defaultValue={selectedPFGroup.id.toString()}
              onValueChange={(value) => {
                const pfGroup = performanceOptions.find((pf) => pf.id.toString() === value);
                if (pfGroup) {setSelectedPFGroup(pfGroup); setCpuCores(Math.min(cpuCores, pfGroup.CPU.max_threads))}
              }} >
              <TabsList className={`grid grid-cols-${performanceOptions.length} w-full`}>
                {performanceOptions.map((pf) => (
                    <TabsTrigger key={pf.id} value={pf.id.toString()}>{pf.Name}</TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>
          </div>

          {/* CPU Cores */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">CPU</h3>
                <span className="text-muted-foreground">{selectedPFGroup.CPU.Name}</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-right text-muted-foreground">{selectedPFGroup.CPU.price_per_core.toFixed(2)}€/Core</div>
            </div>
            <Slider
              value={[cpuCores]}
              min={selectedPFGroup.CPU.min_threads}
              max={selectedPFGroup.CPU.max_threads}
              step={1}
              onValueChange={(value) => setCpuCores(value[0])}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{selectedPFGroup.CPU.min_threads}</span>
              <span>{Math.floor((selectedPFGroup.CPU.min_threads + selectedPFGroup.CPU.max_threads) / 2)}</span>
              <span>{selectedPFGroup.CPU.max_threads}</span>
            </div>
            <div className="text-right font-semibold">{cpuCores}</div>
          </div>

          {/* RAM */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">RAM</h3>
                <span className="text-muted-foreground">(Speed)</span>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-right text-muted-foreground">{ramOption.price_per_gb.toFixed(2)}€/GiB</div>
            </div>
            <Slider
              value={[ramGb]}
              min={ramOption.min_gb}
              max={ramOption.max_gb}
              step={1}
              onValueChange={(value) => setRamGb(value[0])}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{ramOption.min_gb}GB</span>
              <span>{Math.floor((ramOption.min_gb + ramOption.max_gb) / 2)}GB</span>
              <span>{ramOption.max_gb}GB</span>
            </div>
            <div className="text-right font-semibold">{ramGb}</div>
          </div>

          {/* Disk Options */}
          <div className={`grid grid-cols-${Math.min(diskOptions.length, 5)} gap-4`}>
            {diskOptions.map((disk) => (
              <Card
                key={disk.id}
                className={`cursor-pointer ${selectedDiskOption?.id === disk.id ? "border-primary" : ""}`}
                onClick={() => setSelectedDiskOption(disk)}
              >
                <CardContent className="p-4 text-center">
                  <p className="font-semibold">Disk: {disk.size_gb} GiB</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Price Summary */}
          <Card className="bg-muted/40">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-semibold">Price:</span>
              <span className="text-xl font-bold">{totalPrice.toFixed(2)} €</span>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Advanced</Button>
          <Button onClick={handleNext}>Continue</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
