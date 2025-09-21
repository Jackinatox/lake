"use client"

import { Card } from '@/components/ui/card'
import { fetchGames } from '@/lib/actions';
import { GameServer } from '@/models/gameServerModel'
import React, { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MinecraftSettingsProps {
    server: GameServer
}

function MinecraftSettings({ server }: MinecraftSettingsProps) {
    const [loading, setLoading] = useState(false)
    const [gameData, setGameData] = useState<any | null>(null)
    const [selectedFlavorId, setSelectedFlavorId] = useState<number | null>(null)
    const [selectedVersion, setSelectedVersion] = useState<any | null>(null)
    const [gameVersions, setGameVersions] = useState<any[]>([])
    const [flavorOpen, setFlavorOpen] = useState(false)
    const [versionOpen, setVersionOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const data = await fetchGames(1)
                setGameData(data)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [server.egg_id])

    useEffect(() => {
        if (!gameData?.data?.flavors || !Array.isArray(gameData.data.flavors)) return
        // Default to Vanilla (id: 3) if available, else first flavor
        const defaultFlavorId = gameData.data.flavors.find((f: any) => f.id === 3)?.id
            ?? gameData.data.flavors[0]?.id
            ?? null
        setSelectedFlavorId(defaultFlavorId)

        if (defaultFlavorId !== null) {
            const flavor = gameData.data.flavors.find((f: any) => f.id === defaultFlavorId)
            if (flavor && flavor.versions?.length > 0) {
                setSelectedVersion(flavor.versions[flavor.versions.length - 1])
                setGameVersions(flavor.versions)
            }
        }
    }, [gameData])

    useEffect(() => {
        if (selectedFlavorId === null || !gameData?.data?.flavors) return
        const flavor = gameData.data.flavors.find((f: any) => f.id === selectedFlavorId)
        if (!flavor) return
        setGameVersions(flavor.versions ?? [])
        const versionStillExists = (flavor.versions ?? []).some((v: any) => v.version === selectedVersion?.version)
        if (!versionStillExists) {
            setSelectedVersion(flavor.versions?.length > 0 ? flavor.versions[flavor.versions.length - 1] : null)
        }
    }, [selectedFlavorId, gameData?.data?.flavors, selectedVersion])
    
    return (
        <Card>
            <div className="p-4 space-y-4">
                {/* Flavor */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Game Flavor</Label>
                    <Popover open={flavorOpen} onOpenChange={setFlavorOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={flavorOpen}
                                className="w-full justify-between text-left"
                                disabled={loading || !gameData?.data?.flavors?.length}
                            >
                                <span className="truncate">
                                    {selectedFlavorId !== null
                                        ? gameData?.data?.flavors?.find((flavor: any) => flavor.id === selectedFlavorId)?.name || "Select a flavor"
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
                                        {(gameData?.data?.flavors ?? []).map((flavor: any) => (
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

                {/* Version */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Game Version</Label>
                    <Popover open={versionOpen} onOpenChange={setVersionOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={versionOpen}
                                className="w-full justify-between text-left"
                                disabled={loading || gameVersions.length === 0}
                            >
                                <span className="truncate">{selectedVersion?.version || "Select a version"}</span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 z-50" align="start">
                            <Command>
                                <CommandInput placeholder="Search version..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No version found.</CommandEmpty>
                                    <CommandGroup>
                                        {gameVersions.slice().reverse().map((version) => (
                                            <CommandItem
                                                key={version.version}
                                                value={version.version}
                                                onSelect={() => {
                                                    setSelectedVersion(version)
                                                    setVersionOpen(false)
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", selectedVersion?.version === version.version ? "opacity-100" : "opacity-0")} />
                                                <span className="truncate">{version.version}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </Card>
    )
}

export default MinecraftSettings