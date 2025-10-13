"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, Copy, KeyRound, Server } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface FtpAccessDetailsProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  host: string
  port: string
  username: string
  onChangePassword: () => void
  passwordLabel?: string
  passwordPlaceholder?: string
  className?: string
}

export function FtpAccessDetails({
  passwordLabel = "Password",
  passwordPlaceholder = "••••••••",
  isOpen,
  onOpenChange,
  host,
  port,
  username,
  onChangePassword,
  className,
}: FtpAccessDetailsProps) {
  const { toast } = useToast()

  const handleCopy = useCallback(
    async (label: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value)
        toast({
          title: `${label} copied`,
          description: value,
        })
      } catch (error) {
        console.error("Failed to copy", error)
        toast({
          title: `Unable to copy ${label.toLowerCase()}`,
          description: "Please copy it manually instead.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const renderCopyBox = (label: string, value: string) => (
    <button
      key={label}
      type="button"
      className="w-full rounded border bg-background px-3 py-2 text-left text-sm transition hover:bg-muted"
      onClick={() => handleCopy(label, value)}
    >
      <p className="flex items-center justify-between text-xs uppercase text-muted-foreground">
        <span>{label}</span>
        <Copy className="h-3.5 w-3.5" />
      </p>
      <p className="mt-1 flex items-center justify-between font-mono text-sm">
        <span className="truncate" title={value}>
          {value}
        </span>
      </p>
    </button>
  )

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className={cn("rounded-md border bg-muted/40", className)}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              FTP access details
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 pt-1">
          <div className="grid gap-3 sm:grid-cols-2">
            {renderCopyBox("Host", `${host}:${port}`)}
            {renderCopyBox("Username", username)}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Use these credentials with your preferred FTP/SFTP client. You can rotate the password anytime.</p>
            <Button size="sm" onClick={onChangePassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change FTP password
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
