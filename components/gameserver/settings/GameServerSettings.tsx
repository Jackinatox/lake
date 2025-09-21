"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Save, Server } from "lucide-react"
import { GameServer } from "@/models/gameServerModel"
import { Builder } from "@avionrx/pterodactyl-js"
import { useToast } from "@/hooks/use-toast"
import { renameClientServer } from "./serverSettingsActions"
import ReinstallDialog from "./ReinstallDialog"
import { MinecraftConfigComponent } from "@/components/booking2/minecraft-config"
import { fetchGames } from "@/lib/actions"

// Placeholder component - replace with your actual MinecraftFlavourVersion component
function MinecraftFlavourVersion({ onVersionChange }: { onVersionChange: (flavour: string, version: string) => void }) {
  // await fetchGames();
  return (
      // TODO: fetch await fetchGames(id); to then send new docker image to changeServerStartup in useEffect

    <div className="space-y-2">
      <Label>Minecraft Flavour & Version</Label>
      <div className="p-4 border rounded-md bg-muted/50">
        <p className="text-sm text-muted-foreground">Replace this with your MinecraftFlavourVersion component</p>
      </div>
      {/* <MinecraftConfigComponent /> */}
    </div>
  )
}

interface GameServerSettingsProps {
  server: GameServer
  //   onServerUpdate?: (updatedServer: Partial<GameServer>) => void
}

const JAVA_VERSIONS = [
  { value: "java8", label: "Java 8" },
  { value: "java11", label: "Java 11" },
  { value: "java17", label: "Java 17" },
  { value: "java21", label: "Java 21" },
]

export default function GameServerSettings({ server }: GameServerSettingsProps) {
  const [serverName, setServerName] = useState(server.name)
  const [javaVersion, setJavaVersion] = useState("java17")
  const [isReinstalling, setIsReinstalling] = useState(false)
  const [reinstallDialogOpen, setReinstallDialogOpen] = useState(false)
  const { toast } = useToast()

  const isMinecraftServer = server.egg_id >= 0 && server.egg_id <= 5

  const handleSaveServerName = async () => {
    if (await renameClientServer(server.identifier, serverName)) {
      toast({
        title: "Server name updated",
        description: "The server name has been successfully updated.",
        variant: "default",
      })
      server.name = serverName;
    } else {
      toast({
        title: "Server name updated failed",
        description: "The server name update has failed",
        variant: "destructive",
      })
    }
  }

  const handleMinecraftVersionChange = (flavour: string, version: string) => {
    // Handle minecraft version change
    console.log("Minecraft version changed:", { flavour, version })
  }

  return (
    <>
    <ReinstallDialog open={reinstallDialogOpen} onOpenChange={setReinstallDialogOpen}/>
    <div className="space-y-6">
      {/* Basic Server Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Server Settings
          </CardTitle>
          <CardDescription>Configure your game server settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Server Name */}
          <div className="space-y-2">
            <Label htmlFor="server-name">Server Name</Label>
            <div className="flex gap-2">
              <Input
                id="server-name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Enter server name"
              />
              <Button onClick={handleSaveServerName} disabled={serverName === server.name} size="sm">
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Startup Command - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="startup-command">Startup Command</Label>
            <Textarea
              id="startup-command"
              value={server.invocation}
              readOnly
              className="font-mono text-sm bg-muted/50"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This command is automatically generated and cannot be modified.
            </p>
          </div>

          {/* Reinstall Button */}
          <Separator />
          <div className="space-y-2">
            <Label>Server Management</Label>
            <Button onClick={() => {setReinstallDialogOpen(true)}} disabled={isReinstalling} variant="destructive" className="w-full">
              {isReinstalling ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reinstalling...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reinstall Server
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will reinstall the server software. All data will be preserved.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Minecraft-specific Settings */}
      {isMinecraftServer && (
        <Card>
          <CardHeader>
            <CardTitle>Minecraft Configuration</CardTitle>
            <CardDescription>Minecraft-specific server settings (Egg ID: {server.egg_id})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Java Version */}
            <div className="space-y-2">
              <Label htmlFor="java-version">Java Version</Label>
              <Select value={javaVersion} onValueChange={setJavaVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Java version" />
                </SelectTrigger>
                <SelectContent>
                  {JAVA_VERSIONS.map((version) => (
                    <SelectItem key={version.value} value={version.value}>
                      {version.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Minecraft Flavour and Version */}
            <MinecraftFlavourVersion onVersionChange={handleMinecraftVersionChange} />
          </CardContent>
        </Card>
      )}
    </div>
    </>
  )
}
