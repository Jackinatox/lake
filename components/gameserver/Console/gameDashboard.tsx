"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import webSocket from "@/lib/Pterodactyl/webSocket";
import { Cpu, MemoryStickIcon as Memory, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ConsoleV2 from "./ConsoleV2";
import CPUChart from "./graphs/CPUChart";
import RAMChart from "./graphs/RAMChart";
import { PowerBtns } from "./powerBtns";
import { Status } from "./status";
import { ClientServer } from 'pterodactyl.js';
import hr from '@tsmx/human-readable'


interface serverProps {
  server: ClientServer;
  ptApiKey: string;
}

function GameDashboard({ server, ptApiKey }: serverProps) {
  const terminalRef = useRef(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const wsCreds = useRef<any>(null);

  const [serverStats, setServerStats] = useState<any>();

  const handleWsMessage = async (msg: string) => {
    const data = JSON.parse(msg);
    console.log('event: ', data.event);

    switch (data.event) {
      case 'stats': {
        const stats = JSON.parse(data.args[0]);

        const roundedStats = {
          cpu_absolute: parseFloat(stats.cpu_absolute.toFixed(1)),
          disk_bytes: parseFloat((stats.disk_bytes / 1024 / 1024 / 1024).toFixed(2)),
          memory_bytes: parseFloat((stats.memory_bytes / 1024 / 1024 / 1024).toFixed(2)),
          memory_limit_bytes: parseFloat((stats.memory_limit_bytes / 1024 / 1024 / 1024).toFixed(2)),
          network: {
            rx_bytes: stats.network.rx_bytes,
            tx_bytes: stats.network.tx_bytes
          },
          state: stats.state,
          uptime: parseFloat((stats.uptime / 1000).toFixed(2)),
        }
        setServerStats(roundedStats);
        break;
      }

      case 'console output': {
        const consoleLine = data.args[0];
        setLogs((prevLogs) => {
          if (prevLogs[prevLogs.length - 1] === consoleLine) {
            return prevLogs; // Avoid duplicate log
          }
          return [...prevLogs, consoleLine];
        });
        break;
      }

      case "token expiring": {
        console.log("Token expiring... fetching new token.");

        const wsCred = await webSocket(server.identifier, ptApiKey);
        wsCreds.current = wsCred;

        wsRef.current?.send(JSON.stringify({ event: "auth", args: [wsCred?.data.token], }));
        console.log("Re-authenticated WebSocket.");

        break;
      }

      case 'auth success': {
        if (loading) {
          wsRef.current?.send(JSON.stringify({
            event: 'send logs'
          }));
        }

        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const startWebSocket = async () => {
      if (!wsRef.current) {
        const wsCred = await webSocket(server.identifier, ptApiKey);
        wsCreds.current = wsCred;

        const ws: WebSocket = new WebSocket(wsCred?.data.socket);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({
            event: "auth",
            args: [wsCred?.data.token],
          }));
        };

        ws.onmessage = (ev: MessageEvent) => {
          handleWsMessage(ev.data);
        };
      }
    };

    startWebSocket();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);


  const days = Math.floor(serverStats?.uptime / 86400); // 86400 Sekunden pro Tag
  const hours = Math.floor((serverStats?.uptime % 86400) / 3600); // Restliche Stunden
  const minutes = Math.floor((serverStats?.uptime % 3600) / 60); // Restliche Minuten

  const handleStart = () => {
    if (!loading && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        event: 'set state',
        args: ["start"]
      }));
    }
  }

  const handleRestart = () => {
    if (!loading && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        event: 'set state',
        args: ["restart"]
      }));
    }
  }

  // STOP
  const handleStop = () => {
    if (!loading && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        event: 'set state',
        args: ["stop"]
      }));
    }
  }

  const handleKill = () => {
    if (!loading && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        event: 'set state',
        args: ["kill"]
      }));
    }
  }

  const handleCommand = (command: string) => {
    console.log(command)
    wsRef.current?.send(JSON.stringify({
      event: 'send command',
      args: [command]
    }));
  }

  return (
    <>
      <div className="w-full">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
          {/* Header with server info and controls - spans full width */}
          <Card className="border-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 lg:col-span-12">
            <CardHeader className="pb-2">
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <CardTitle className="text-xl font-bold">Minecraft Server</CardTitle>
                <Badge variant={serverStats?.state.toLowerCase() === "online" ? "default" : "outline"} className="px-3 py-1">
                  <Status state={serverStats?.state} />
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
                    <div>—</div>
                    <div className="font-medium">Players:</div>
                    <div>{serverStats?.state.toLowerCase() === "online" ? "2/20" : "—"}</div>
                    <div className="font-medium">Uptime:</div>
                    <div>{serverStats?.state.toLowerCase() === "online" ? "2h 15m" : "—"}</div>
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

          <Card className="lg:col-span-8 lg:row-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="h-5 w-5" /> Console
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)]">
              <div className="flex h-full flex-col gap-4">
                <ConsoleV2 logs={logs} handleCommand={handleCommand} />
                {/* <div className="flex gap-2">
                  <input type="text" placeholder="Type a command..." className="flex-1 rounded-md border px-3 py-2" />
                  <Button>Send</Button>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Performance metrics - takes up 4/12 columns on desktop */}
          <div className="flex flex-col gap-4 lg:col-span-4 lg:row-span-1">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cpu className="h-5 w-5" /> CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Separator className="my-1" />
                <div className="flex justify-between pb-2 text-sm">
                  <div className="font-medium">Current:</div>
                  <div>{serverStats?.cpu_absolute + '%'} / {server.limits.cpu + ' %'}</div>
                  {/* <div className="font-medium">Average:</div>
                  <div>52%</div> */}
                </div>
                <CPUChart newData={serverStats} />
                <Separator className="my-3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Memory className="h-5 w-5" /> Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Separator className="my-1" />
                <div className="flex justify-between gap-1 text-sm pb-2">
                  <div className="font-medium">Current:</div>
                  <div> {serverStats?.memory_bytes + ' GiB'}  / {server.limits.memory / 1024 + ' GiB'}</div>
                  {/* <div className="font-medium">Peak:</div>
                  <div>2.8GB (70%)</div> */}
                </div>
                <RAMChart newData={serverStats} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>)
}

export default GameDashboard