"use client"

import { useEffect, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"
import { bookServer } from "@/app/booking/[game]/action"

interface Flavor {
  value: string
  label: string
  versions: string[]
}

interface MCCProps {
  config?: any
}


export default function MinecraftConfig({ config }: MCCProps) {
  const supabase = createClient()

  // Loading indicator
  const [loading, setLoading] = useState(true)

  // Data states
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [versions, setVersions] = useState<string[]>([])

  // Selection states
  const [selectedFlavor, setSelectedFlavor] = useState<string>("Vanilla")
  const [selectedVersion, setSelectedVersion] = useState<string>("")

  // UI state for popovers
  const [flavorOpen, setFlavorOpen] = useState(false)
  const [versionOpen, setVersionOpen] = useState(false)

  
const Submit = () => {
    config.env.gameVersion = selectedVersion;
    config.env.gameFlavour = selectedFlavor;

    bookServer(config);
}

  // Fetch flavor/version data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from("GameData")
          .select("data")
          .eq("name", "minecraft")
          .single()

        if (error) throw error
        //TODO: Simulate network delay (remove in production)
        await new Promise((res) => setTimeout(res, 3000))

        const raw = data.data as Record<string, { name: string; versions: string[] }>

        // Map raw object into array for easier rendering
        const mapped = Object.entries(raw).map(([key, val]) => ({
          value: key,
          label: val.name,
          versions: val.versions,
        }))

        setFlavors(mapped)
        setLoading(false)
      } catch (e) {
        console.error("Failed to fetch Minecraft data:", e)
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

  // Initialize default selections once flavors are loaded
  useEffect(() => {
    if (!loading && flavors.length) {
      const first = flavors[0]
      setSelectedFlavor(first.value)
      setVersions(first.versions)
      setSelectedVersion(first.versions[0] || "")
    }
  }, [loading, flavors])

  // Update versions list when flavor changes
  useEffect(() => {
    if (!loading && selectedFlavor) {
      const flavor = flavors.find((f) => f.value === selectedFlavor)
      if (flavor) {
        setVersions(flavor.versions)
        setSelectedVersion(flavor.versions[0] || "")
      }
    }
  }, [selectedFlavor, flavors, loading])

  const isValid = Boolean(selectedFlavor && selectedVersion)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Minecraft Launcher</CardTitle>
        <CardDescription>
          Select your preferred Minecraft flavor and version
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flavor selector */}
        <div className="space-y-2">
          <label htmlFor="flavor" className="text-sm font-medium">
            Minecraft Flavor
          </label>
          <Popover open={flavorOpen} onOpenChange={setFlavorOpen}>
            <PopoverTrigger asChild disabled={loading}>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={flavorOpen}
                className="w-full justify-between"
              >
                {selectedFlavor
                  ? flavors.find((f) => f.value === selectedFlavor)?.label
                  : "Select flavor..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search flavor..." />
                <CommandList>
                  <CommandEmpty>No flavor found.</CommandEmpty>
                  <CommandGroup>
                    {flavors.map((flavor) => (
                      <CommandItem
                        key={flavor.value}
                        value={flavor.value}
                        onSelect={(val) => {
                          setSelectedFlavor(val)
                          setFlavorOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedFlavor === flavor.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {flavor.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Version selector */}
        <div className="space-y-2">
          <label htmlFor="version" className="text-sm font-medium">
            Game Version
          </label>
          <Popover open={versionOpen} onOpenChange={setVersionOpen}>
            <PopoverTrigger asChild disabled={loading}>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={versionOpen}
                className="w-full justify-between"
              >
                {selectedVersion || "Select version..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search version..." />
                <CommandList>
                  <CommandEmpty>No version found.</CommandEmpty>
                  <CommandGroup>
                    {versions.map((version) => (
                      <CommandItem
                        key={version}
                        value={version}
                        onSelect={(val) => {
                          setSelectedVersion(val)
                          setVersionOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedVersion === version
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {version}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Launch button */}
        <div className="pt-4">
          <Button className="w-full" disabled={!isValid || loading} onClick={Submit}>
            Launch Minecraft {selectedFlavor}{" "}
            {selectedVersion}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
