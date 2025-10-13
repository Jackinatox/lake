"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Save, Server } from "lucide-react"
import ReinstallDialog from "./ReinstallDialog"
import { GameServer } from "@/models/gameServerModel"
import { useToast } from "@/hooks/use-toast"
import { renameClientServer } from "./serverSettingsActions"

export interface ServerSettingsCardProps {
  server: GameServer
}

export default function ServerSettingsCard({ server }: ServerSettingsCardProps) {
  const [serverName, setServerName] = useState(server.name)
  const { toast } = useToast()

  const handleSaveServerName = async () => {
    if (await renameClientServer(server.identifier, serverName)) {
      toast({
        title: "Server name updated",
        description: "The server name has been successfully updated.",
        variant: "default",
      })
      server.name = serverName
    } else {
      toast({
        title: "Server name updated failed",
        description: "The server name update has failed",
        variant: "destructive",
      })
    }
  }
  return (
    <>
      <div>
        <Card>          
          <CardHeader className="pb-0 md:pb-0">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Server Settings
            </CardTitle>
            <CardDescription>Configure your game server settings</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Server Name */}
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="server-name"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Enter server name"
                  className="flex-1"
                  maxLength={64}
                />
                <Button 
                  onClick={handleSaveServerName} 
                  disabled={serverName === server.name || serverName.trim() === ""} 
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Save</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
