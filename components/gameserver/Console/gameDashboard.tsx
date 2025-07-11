"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import webSocket from "@/lib/Pterodactyl/webSocket"
import { Cpu, MemoryStickIcon as Memory, Terminal } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import ConsoleV2 from "./ConsoleV2"
import CPUChart from "./graphs/CPUChart"
import RAMChart from "./graphs/RAMChart"
import { PowerBtns } from "./powerBtns"
import { Status } from "./status"
import { TabsComponent } from "../GameserverTabs"
import { FileManager } from "../FileManager/FileManager"
import { BackupManager } from "../BackupManager/BackupManager"
import { GameServer } from "@/models/gameServerModel"
import EulaDialog from "../EulaDialog"
import { FileApiService } from "../FileManager/file-api"
import GameServerSettings from "../settings/GameServerSettings"


interface serverProps {
  server: GameServer
  ptApiKey: string
  gameId: number
}

function GameDashboard({ server, ptApiKey, gameId }: serverProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [eulaOpen, setEulaOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null)
  const wsCreds = useRef<any>(null)

  const [serverStats, setServerStats] = useState<any>()

  const handleWsMessage = async (msg: string) => {
    const data = JSON.parse(msg)
    console.log("event: ", data.event)

    switch (data.event) {
      case "stats": {
        const stats = JSON.parse(data.args[0])

        const roundedStats = {
          cpu_absolute: Number.parseFloat(stats.cpu_absolute.toFixed(1)),
          disk_bytes: Number.parseFloat((stats.disk_bytes / 1024 / 1024 / 1024).toFixed(2)),
          memory_bytes: Number.parseFloat((stats.memory_bytes / 1024 / 1024 / 1024).toFixed(2)),
          memory_limit_bytes: Number.parseFloat((stats.memory_limit_bytes / 1024 / 1024 / 1024).toFixed(2)),
          network: {
            rx_bytes: stats.network.rx_bytes,
            tx_bytes: stats.network.tx_bytes,
          },
          state: stats.state,
          uptime: Number.parseFloat((stats.uptime / 1000).toFixed(2)),
        }
        setServerStats(roundedStats)
        break
      }

      case "console output": {
        const consoleLine = data.args[0]
        if (consoleLine.includes('You need to agree to the EULA in order to run the server.')) {
          setEulaOpen(true)
        }
        setLogs((prevLogs) => {
          if (prevLogs[prevLogs.length - 1] === consoleLine) {
            return prevLogs // Avoid duplicate log
          }
          return [...prevLogs, consoleLine]
        })
        break
      }

      case "token expiring": {
        console.log("Token expiring... fetching new token.")

        const wsCred = await webSocket(server.identifier, ptApiKey)
        wsCreds.current = wsCred

        wsRef.current?.send(JSON.stringify({ event: "auth", args: [wsCred?.data.token] }))
        console.log("Re-authenticated WebSocket.")

        break
      }

      case "auth success": {
        if (loading) {
          wsRef.current?.send(
            JSON.stringify({
              event: "send logs",
            }),
          )
        }

        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const startWebSocket = async () => {
      if (!wsRef.current) {
        const wsCred = await webSocket(server.identifier, ptApiKey)
        wsCreds.current = wsCred

        const ws: WebSocket = new WebSocket(wsCred?.data.socket)
        wsRef.current = ws

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              event: "auth",
              args: [wsCred?.data.token],
            }),
          )
        }

        ws.onmessage = (ev: MessageEvent) => {
          handleWsMessage(ev.data)
        }
      }
    }

    startWebSocket()

    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [])

  const days = Math.floor(serverStats?.uptime / 86400) // 86400 Sekunden pro Tag
  const hours = Math.floor((serverStats?.uptime % 86400) / 3600) // Restliche Stunden
  const minutes = Math.floor((serverStats?.uptime % 3600) / 60) // Restliche Minuten

  console.log(serverStats)

  const handleAcceptEula = async () => {
    if (!loading && wsRef.current) {
      const apiService = new FileApiService(server.identifier);
      await apiService.saveFileContent('eula.txt', 'eula=true');
      handleRestart();
    }
  }

  const handleStart = () => {
    if (!loading && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          event: "set state",
          args: ["start"],
        }),
      )
    }
  }

  const handleRestart = () => {
    if (!loading && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          event: "set state",
          args: ["restart"],
        }),
      )
    }
  }

  // STOP
  const handleStop = () => {
    if (!loading && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          event: "set state",
          args: ["stop"],
        }),
      )
    }
  }

  const handleKill = () => {
    if (!loading && wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          event: "set state",
          args: ["kill"],
        }),
      )
    }
  }

  const handleCommand = (command: string) => {
    console.log(command)
    wsRef.current?.send(
      JSON.stringify({
        event: "send command",
        args: [command],
      }),
    )
  }


  const defAlloc = server.relationships?.allocations?.data?.find(
    (alloc: any) => alloc.attributes.is_default);
  const ipPortCombo = defAlloc.attributes.ip_alias + ":" + defAlloc.attributes.port;

  // Console component to pass to the tabs
  const ConsoleComponent = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
      <Card className="lg:col-span-8 lg:row-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="h-5 w-5" /> Console
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)]">
          <div className="flex h-full flex-col gap-4">
            <ConsoleV2 logs={logs} handleCommand={handleCommand} />
          </div>
        </CardContent>
      </Card>

      {/* Performance metrics - takes up 4/12 columns on desktop */}
      <div className="flex flex-col gap-4 lg:col-span-4 lg:row-span-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="h-5 w-5" /> CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CPUChart newData={serverStats} />
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div className="font-medium">Current:</div>
              <div>{serverStats?.cpu_absolute + "% / " + server.limits.cpu + ' %'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Memory className="h-5 w-5" /> Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RAMChart newData={serverStats} />
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div className="font-medium">Current:</div>
              <div>
                {" "}
                {serverStats?.memory_bytes + " GiB"} / {server.limits.memory / 1024 + " GiB"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <>
      <EulaDialog isOpen={eulaOpen} onAcceptEula={handleAcceptEula} setOpen={setEulaOpen} />
      <div className="w-full">
        {/* Header with server info and controls - spans full width */}
        <Card className="border-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 mb-4">
          <CardHeader className="pb-2">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <CardTitle className="text-xl font-bold">Minecraft Server</CardTitle>
              <Badge
                variant={serverStats?.state.toLowerCase() === "online" ? "default" : "outline"}
                className="px-3 py-1"
              >
                <Status state={serverStats?.state} />
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
              <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800 lg:col-span-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Server IP:</div>
                  <div>
                    <span className="flex items-center gap-2">
                      {ipPortCombo ? ipPortCombo : "No Allocation found"}
                      {ipPortCombo && (
                        <button
                          type="button"
                          className="ml-2 rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                          title="Copy IP:Port"
                          onClick={() => {
                            navigator.clipboard.writeText(ipPortCombo)
                          }}
                        >
                          Copy
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="font-medium">Name:</div>
                  <div>{server.name}</div>
                  <div className="font-medium">Players:</div>
                  <div>{serverStats?.state.toLowerCase() === "online" ? "2/20" : "—"}</div>
                  <div className="font-medium">Uptime:</div>
                  <div>
                    {serverStats?.uptime !== undefined
                      ? `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${Math.floor(serverStats.uptime % 60)}s`
                      : "—"}</div>
                </div>
              </div>

              <div className="rounded-md border bg-card p-3 sm:col-span-1 lg:col-span-8">
                <h3 className="mb-2 font-semibold">Server Controls</h3>
                <PowerBtns
                  loading={loading}
                  onStart={handleStart}
                  onStop={handleStop}
                  onRestart={handleRestart}
                  onKill={handleKill}
                  state={serverStats?.state}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsComponent
          consoleComponent={ConsoleComponent}
          fileManagerComponent={<FileManager server={server} />}
          backupManagerComponent={<BackupManager server={server} />}
          settingsComponent={<GameServerSettings server={server} />}
        />
      </div>
    </>
  )
}

export default GameDashboard
