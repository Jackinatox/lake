"use client"

import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {useTranslations} from 'next-intl';

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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${buttonSizeClasses[size]} rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors ${className}`}
            aria-label="More information"
            onClick={(e) => e.stopPropagation()} // Prevent event bubbling when used in other buttons
          >
            <Info className={sizeClasses[size]} />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm" side="top" align="center" sideOffset={5}>
          <p className="leading-relaxed">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
