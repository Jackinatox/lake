import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Power, RefreshCw, Square } from "lucide-react";


interface ControllPanelProps {
    loading: boolean
    onStart: () => void
    onRestart: () => void
    onStop: () => void
    onKill: () => void
    state: string
}

export default function ControllPanel({
    loading,
    onStart,
    onRestart,
    onStop,
    onKill,
    state
}: ControllPanelProps) {

    if (!state)
        return (<div>no state</div>);

    return <Card className="border-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 lg:col-span-12">
        <CardHeader className="pb-2">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <CardTitle className="text-xl font-bold">Minecraft Server</CardTitle>
                <Badge variant={state.toLowerCase() === "online" ? "default" : "outline"} className="px-3 py-1">
                    <Status state={state} />
                </Badge>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
                <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800 lg:col-span-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Server IP:</div>
                        <div>mc.example.com</div>
                        <div className="font-medium">Version:</div>
                        <div>1.19.2</div>
                        <div className="font-medium">Players:</div>
                        <div>{state.toLowerCase() === "online" ? "2/20" : "—"}</div>
                        <div className="font-medium">Uptime:</div>
                        <div>{state.toLowerCase() === "online" ? "2h 15m" : "—"}</div>
                    </div>
                </div>

                <div className="rounded-md border bg-card p-3 sm:col-span-1 lg:col-span-8">
                    <h3 className="mb-2 font-semibold">Server Controls</h3>
                    <PowerBtns
                        loading={loading}
                        onStart={onStart}
                        onStop={onStop}
                        onRestart={onRestart}
                        onKill={onKill}
                        state={state} />
                </div>
            </div>
        </CardContent>
    </Card>
}

interface PowerBtnsProps {
    loading: boolean
    onStart: () => void
    onRestart: () => void
    onStop: () => void
    onKill: () => void
    state: string
}

function PowerBtns({ loading, onStart, onRestart, onStop, onKill, state }: PowerBtnsProps) {
    const isOnline = state ? state.toLowerCase() === "online" : false
    const isOffline = state ? state.toLowerCase() === "offline" : true
    const isTransitioning = !isOnline && !isOffline

    return (
        <div className="flex flex-wrap gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={onStart}
                disabled={loading || isOnline || isTransitioning}
                className="flex items-center gap-1"
            >
                <Play className="h-4 w-4" />
                Start
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                disabled={loading || isOffline}
                className="flex items-center gap-1"
            >
                <Square className="h-4 w-4" />
                Stop
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onRestart}
                disabled={loading || isOffline}
                className="flex items-center gap-1"
            >
                <RefreshCw className="h-4 w-4" />
                Restart
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={onKill}
                disabled={loading || isOffline}
                className="flex items-center gap-1"
            >
                <Power className="h-4 w-4" />
                Kill
            </Button>
        </div>
    )
}

interface InfoProps {
  state: string
}


export function Status({ state }: InfoProps) {
  const getStatusColor = () => {
    switch (state? state.toLowerCase(): 'offline') {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "starting":
        return "bg-yellow-500"
      case "stopping":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
      <span className="font-medium capitalize">{state}</span>
    </div>
  )
}