"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calcDiskSize } from "@/lib/globalFunctions"
import type { HardwareConfig } from "@/models/config"
import { PerformanceGroup } from "@/models/prisma"
import { useEffect, useState } from "react"
import InfoButton from "../InfoButton"

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
  const [days, setDays] = useState(30);
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
      const cpuPrice = selectedPFGroup.cpu.pricePerCore / 30 * cpuCores * days;
      const ramPrice = selectedPFGroup.ram.pricePerGb / 30 * ramGb * days;

      setTotalPrice(Number.parseFloat((cpuPrice + ramPrice).toFixed(2)))
    }
  }, [selectedPFGroup, cpuCores, ramGb, days])

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
    <div className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Section */}
      <div className="lg:col-span-2 flex flex-col">
        <Card className="h-full shadow-lg">
          <CardHeader>
            <CardTitle>Performance Configuration</CardTitle>
            <CardDescription>Customize your server hardware.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Group Tabs */}
            <Tabs
              value={selectedPFGroup.id.toString()}
              onValueChange={(value) => {
                const pfGroup = performanceOptions.find((pf) => pf.id.toString() === value);
                if (pfGroup) {
                  setSelectedPFGroup(pfGroup);
                  setCpuCores(Math.min(cpuCores, pfGroup.cpu.maxThreads));
                }
              }}
            >
              <TabsList className="grid grid-cols-2 md:grid-cols-2 gap-2">
                {performanceOptions.map((pf) => (
                  <TabsTrigger key={pf.id} value={pf.id.toString()}>{pf.name} <InfoButton className="pl-1" text="kleine info" /></TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Duration Selection */}
            <Tabs
              value={days.toString()}
              onValueChange={(value) => setDays(parseInt(value))}
            >
              <TabsList className="grid grid-cols-4 gap-2">
                <TabsTrigger value="7">1 Week</TabsTrigger>
                <TabsTrigger value="30">1 Month</TabsTrigger>
                <TabsTrigger value="90">3 Months (-10%)</TabsTrigger>
                <TabsTrigger value="180">6 Months (-15%)</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* CPU Configuration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">{cpuCores} vCore(s)</div>
                  <span className="text-muted-foreground">{selectedPFGroup.cpu.name}</span>
                </div>
                <div className="text-muted-foreground">{selectedPFGroup.cpu.pricePerCore.toFixed(2)} € / vCore</div>
              </div>
              <Slider
                value={[cpuCores]}
                min={selectedPFGroup.cpu.minThreads}
                max={selectedPFGroup.cpu.maxThreads}
                step={1}
                onValueChange={(value) => setCpuCores(value[0])}
              />
            </div>

            {/* RAM Configuration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">{ramGb} GiB RAM</div>
                <div className="text-muted-foreground">{selectedPFGroup.ram.pricePerGb.toFixed(2)} € / GiB</div>
              </div>
              <Slider
                value={[ramGb]}
                min={ramOption.minGb}
                max={ramOption.maxGb}
                step={1}
                onValueChange={(value) => setRamGb(value[0])}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Overview Section */}
      <div className="flex flex-col">
        <Card className="h-full shadow-lg flex flex-col">
          <CardHeader>
            <CardTitle>Price Overview</CardTitle>
            <CardDescription>
              A summary of your selected configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center w-full">
                <span className="flex-1">CPU ({cpuCores} vCore{cpuCores > 1 ? "s" : ""})</span>
                <span className="text-right flex-none">{(selectedPFGroup.cpu.pricePerCore / 30 * cpuCores * days).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center w-full">
                <span className="flex-1">RAM ({ramGb} GiB)</span>
                <span className="text-right flex-none">{(selectedPFGroup.ram.pricePerGb / 30 * ramGb * days).toFixed(2)} €</span>
              </div>
              {(calculateDiscount(days, totalPrice).amount !== 0.0) &&
                <div className="flex justify-between items-center w-full text-green-600 font-semibold">
                  <span className="flex-1">Discount (-{calculateDiscount(days, totalPrice).percent}%)</span>
                  <span className="text-right flex-none">- {calculateDiscount(days, totalPrice).amount.toFixed(2)} €</span>
                </div>
              }
            </div>
          </CardContent>
          <CardFooter className="border-t pt-2 flex flex-col space-y-2 font-semibold">
            <div className="flex justify-between items-center w-full">
              <span className="flex-1">Price per Month</span>
              <span className="text-right flex-none">{((totalPrice - calculateDiscount(days, totalPrice).amount) / (days / 30)).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="flex-1">Pay Now (No Subscription)</span>
              <span className="text-right flex-none">{(totalPrice - calculateDiscount(days, totalPrice).amount).toFixed(2)} €</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  // Helper function to calculate discount
  function calculateDiscount(days, totalPrice) {
    let percent = 0;
    if (days >= 180) {
      percent = 15; // 15% discount for 6 months
    } else if (days >= 90) {
      percent = 10; // 10% discount for 3 months
    } else if (days >= 30) {
      percent = 0; // 0% discount for 1 month
    }
    const amount = totalPrice * (percent / 100);
    return { amount, percent };
  }
}
