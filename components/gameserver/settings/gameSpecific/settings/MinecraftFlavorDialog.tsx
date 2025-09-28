"use client"

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TriangleAlert } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { GameFlavor } from "@/types/gameData";
import { fetchGames } from "@/lib/actions";
import { GameServer } from "@/models/gameServerModel";

type Flavor = GameFlavor

interface MinecraftFlavorDialogProps {
  triggerText?: string
  eggId: number
  onConfirm?: (payload: { flavorId: number; eggId: number }) => void
  server: GameServer
}

export function MinecraftFlavorDialog({ triggerText = "Server flavour ändern", eggId, onConfirm, server }: MinecraftFlavorDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  // Using shadcn Select (no search) for a clean mobile-friendly dropdown

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        // Minecraft-specific dialog: fetch the Minecraft game data entry by name
        console.log("fetching with id: " + server.gameDataId)
        const data = await fetchGames(server.gameDataId)
        const raw = (data?.data as unknown) as any | null
        const f: Flavor[] = raw?.flavors ?? []
        setFlavors(f)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  useEffect(() => {
    if (!flavors) return
    const run = async () => {
      const selected = flavors.find((x) => x.id === server.gameData.flavorId)
      console.log("Gamedata:", server.gameData)
      console.log("flavours: ", flavors)
      const defaultFlavorId = selected?.id ?? flavors[0]?.id
      console.log(flavors)
      setSelectedFlavorId(defaultFlavorId)
    }
    run()
  }, [open, flavors])

  // Responsive behavior: use a bottom sheet on mobile for better UX
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 640px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches)
    // Initialize
    handler(mq)
    // Subscribe
    mq.addEventListener?.('change', handler as (e: MediaQueryListEvent) => void)
    return () => {
      mq.removeEventListener?.('change', handler as (e: MediaQueryListEvent) => void)
    }
  }, [])

  const Body = (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Game Flavor</Label>
          <Select
            value={selectedFlavorId !== null ? String(selectedFlavorId) : undefined}
            onValueChange={(val) => setSelectedFlavorId(Number(val))}
          >
            <SelectTrigger className="w-full" disabled={loading || flavors.length === 0}>
              <SelectValue placeholder="Select a flavor" />
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectGroup>
                {flavors.map((flavor) => (
                  <SelectItem key={flavor.id} value={String(flavor.id)}>
                    {flavor.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Version selection removed */}
      </div>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
        <Button
          variant="destructive"
          disabled={selectedFlavorId === server.gameData.flavorId}
          onClick={() => {
            if (!selectedFlavorId) return
            onConfirm?.({ flavorId: selectedFlavorId, eggId })
            setOpen(false)
          }}
        >
          Neuen Flavor installieren
        </Button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">{triggerText}</Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-xl pb-6"
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null
            if (target && (target.closest('[data-radix-select-content]') || target.closest('[role="listbox"]'))) {
              e.preventDefault()
            }
          }}
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
              <TriangleAlert className="text-yellow-500 h-5 w-5" />
              Server Flavor ändern
            </SheetTitle>
            <SheetDescription>
              Nach dem wechseln wird der Server neu installiert, die Welt sollte erhalten bleiben, es wird aber ein <b className="text-primary font-semibold">Backup</b> empfohlen!
            </SheetDescription>
          </SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <TriangleAlert className="text-yellow-500 h-5 w-5" />
            Server Flavor ändern
          </DialogTitle>
          <DialogDescription>
            Nach dem wechseln wird der Server neu installiert, die Welt sollte erhalten bleiben, es wird aber ein <b className="text-primary font-semibold">Backup</b> empfohlen!
          </DialogDescription>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  )
}
