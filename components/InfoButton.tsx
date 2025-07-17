"use client"

import { Info, InfoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslations } from 'next-intl';

interface InfoButtonProps {
  text: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export default function InfoButton({ text, className = "", size = "sm" }: InfoButtonProps) {
  const t = useTranslations('info-buttons');
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const buttonSizeClasses = {
    sm: "h-5 w-5 p-0",
    md: "h-6 w-6 p-0",
    lg: "h-7 w-7 p-0",
  }

  return (
    <div className="pl-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon />

          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-sm" side="top" align="center" sideOffset={5}>
            <p className="leading-relaxed">{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
