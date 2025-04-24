"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Minecraft flavor data with associated versions
const minecraftData = {
  vanilla: {
    name: "Vanilla",
    versions: [
      "1.20.4",
      "1.20.2",
      "1.19.4",
      "1.19.2",
      "1.18.2",
      "1.17.1",
      "1.16.5",
      "1.15.2",
      "1.14.4",
      "1.12.2",
      "1.8.9",
      "1.7.10",
    ],
  },
  forge: {
    name: "Forge",
    versions: [
      "1.20.4",
      "1.20.2",
      "1.19.4",
      "1.19.2",
      "1.18.2",
      "1.17.1",
      "1.16.5",
      "1.15.2",
      "1.14.4",
      "1.12.2",
      "1.8.9",
      "1.7.10",
    ],
  },
  fabric: {
    name: "Fabric",
    versions: ["1.20.4", "1.20.2", "1.19.4", "1.19.2", "1.18.2", "1.17.1", "1.16.5", "1.15.2", "1.14.4"],
  },
  quilt: {
    name: "Quilt",
    versions: ["1.20.4", "1.20.2", "1.19.4", "1.19.2", "1.18.2", "1.17.1"],
  },
}

// Convert the data to arrays for easier mapping
const flavors = Object.entries(minecraftData).map(([id, data]) => ({
  value: id,
  label: data.name,
}))

interface MCCProps {
    config: any;
}

export default function MinecraftConfig({ config }: MCCProps) {
  const [open, setOpen] = useState(false)
  const [versionOpen, setVersionOpen] = useState(false)
  const [selectedFlavor, setSelectedFlavor] = useState("vanilla")
  const [selectedVersion, setSelectedVersion] = useState(minecraftData.vanilla.versions[0])

  // Get available versions based on selected flavor
  const availableVersions = minecraftData[selectedFlavor as keyof typeof minecraftData].versions

  // Handle flavor change
  const handleFlavorChange = (value: string) => {
    setSelectedFlavor(value)
    // Reset version to first available for the new flavor
    setSelectedVersion(minecraftData[value as keyof typeof minecraftData].versions[0])
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Minecraft Launcher</CardTitle>
        <CardDescription>Select your preferred Minecraft flavor and version</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="flavor" className="text-sm font-medium">
            Minecraft Flavor
          </label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                {selectedFlavor ? minecraftData[selectedFlavor as keyof typeof minecraftData].name : "Select flavor..."}
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
                        onSelect={(currentValue) => {
                          handleFlavorChange(currentValue)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", selectedFlavor === flavor.value ? "opacity-100" : "opacity-0")}
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

        <div className="space-y-2">
          <label htmlFor="version" className="text-sm font-medium">
            Game Version
          </label>
          <Popover open={versionOpen} onOpenChange={setVersionOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={versionOpen} className="w-full justify-between">
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
                    {availableVersions.map((version) => (
                      <CommandItem
                        key={version}
                        value={version}
                        onSelect={(currentValue) => {
                          setSelectedVersion(currentValue)
                          setVersionOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", selectedVersion === version ? "opacity-100" : "opacity-0")}
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

        <div className="pt-4">
          <Button className="w-full">
            Launch Minecraft {minecraftData[selectedFlavor as keyof typeof minecraftData].name} {selectedVersion}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
