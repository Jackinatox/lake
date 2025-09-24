"use client"

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function MinecraftFlavorDialog({ triggerText = "Change server flavour", eggId, onConfirm, server }: MinecraftFlavorDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null)
  const [flavorOpen, setFlavorOpen] = useState(false)

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


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Change server flavour</DialogTitle>
          <DialogDescription>Select a flavour and version for your Minecraft server.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Game Flavor</Label>
            <Popover open={flavorOpen} onOpenChange={setFlavorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={flavorOpen}
                  className="w-full justify-between text-left"
                  disabled={loading || flavors.length === 0}
                >
                  <span className="truncate">
                    {selectedFlavorId !== null
                      ? flavors.find((flavor) => flavor.id === selectedFlavorId)?.name || "Select a flavor"
                      : "Select a flavor"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-50" align="start">
                <Command>
                  <CommandInput placeholder="Search flavor..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No flavor found.</CommandEmpty>
                    <CommandGroup>
                      {flavors.map((flavor) => (
                        <CommandItem
                          key={flavor.id}
                          value={flavor.name}
                          onSelect={() => {
                            setSelectedFlavorId(flavor.id)
                            setFlavorOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedFlavorId === flavor.id ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{flavor.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Version selection removed */}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
          <Button
            disabled={!selectedFlavorId}
            onClick={() => {
              if (!selectedFlavorId) return
              onConfirm?.({ flavorId: selectedFlavorId, eggId })
              setOpen(false)
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
