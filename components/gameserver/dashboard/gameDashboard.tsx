"use client"

import webSocket from "@/lib/Pterodactyl/webSocket";
import { useEffect, useRef, useState } from "react"
import { Gamepad2Icon, Server } from "lucide-react";
import { Status } from "./status";
import { PowerBtns } from "./powerBtns";
import CPUChart from "./graphs/CPUChart";
import RAMChart from "./graphs/RAMChart";
import ConsoleV2 from "./ConsoleV2";
import { Card } from "@/components/ui/card";
import { Grid } from "@mui/joy";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import Link from "next/dist/client/link";
import ControllPanel from "./panel";

interface serverProps {
  server: string;
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

        const wsCred = await webSocket(server, ptApiKey);
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
        const wsCred = await webSocket(server, ptApiKey);
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
      {/* <BreakpointDisplay /> */}
      <div>
        <ControllPanel loading={loading} onKill={handleKill} onRestart={handleRestart} onStart={handleStart} onStop={handleStop} state={serverStats ? serverStats.state : 'offline'} />
      </div>

      <ConsoleV2 logs={logs} handleCommand={handleCommand} />

      {/* Left Side: CPU Chart (Takes 50%) */}

      <div className="flex flex-row w-full">
        <div className="w-1/2 pr-2">
          <CPUChart newData={serverStats} />
        </div>
        <div className="w-1/2 pl-2">
          <RAMChart newData={serverStats} />
        </div>
      </div>

      <div>
        <div className="font-bold">Debug information</div>
        <p>Uptime: {days}d {hours}h {minutes}min</p>
        {/*<p>CPU: {serverStats?.cpu_absolute} %</p>
        <p>Memory: {serverStats?.memory_bytes} GiB</p>
        <p>Memory Limit: {serverStats?.memory_limit_bytes} GiB</p>*/}
        <p>Disk: {serverStats?.disk_bytes} GiB</p>
        <p>Network RX: {serverStats?.network.rx_bytes} bytes</p>
        <p>Network TX: {serverStats?.network.tx_bytes} bytes</p>
        <p>State: {serverStats?.state}</p>
        <p>Uptime: {serverStats?.uptime} sek</p>
        <p>{days}d {hours}h {minutes}min</p>
      </div>
    </>
  )
}

export default GameDashboard