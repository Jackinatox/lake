"use client"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"

interface SliderWithLabelsProps {
  min: number
  max: number
  value: number[]
  onValueChange: (value: number[]) => void
  step?: number
  className?: string
}

export function CustomSlider({ min, max, value, onValueChange, step = 1, className }: SliderWithLabelsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <Slider min={min} max={max} step={step} value={value} onValueChange={onValueChange} />

      <div className="flex justify-between px-1">
        <span className="text-sm text-muted-foreground">{min}</span>

        <span className="text-sm text-muted-foreground">{max / 2}</span>
        
        <span className="text-sm text-muted-foreground">{max}</span>
      </div>
    </div>
  )
}
