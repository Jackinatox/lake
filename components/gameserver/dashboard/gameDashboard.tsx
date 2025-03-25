"use client"

import webSocket from "@/lib/Pterodactyl/webSocket";
import { useEffect, useRef, useState } from "react"
import Console from "./console";
import { Gamepad2Icon, Server } from "lucide-react";
import CopyAddress from "./copyAddress";
import { Status } from "./status";
import { PowerBtns } from "./powerBtns";
import { Info } from "./info";
import { GameServerSettings } from "@/models/settings";
import CPUChart from "./graphs/CPUChart";
import { Button } from "@/components/ui/button";
import RAMChart from "./graphs/RAMChart";
import ConsoleV2 from "./ConsoleV2";
import { Card } from "@/components/ui/card";
import { Grid } from "@mui/joy";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import Link from "next/dist/client/link";

const settings: GameServerSettings = {
  egg: 'Minecraft',
  ver: '1.17.1',
  flavour: 'Paper',
  node: '01',
  wing: '01',
  cpuModel: 'Ryzen 5 5950X',
  vCores: 4,
  mem: 4096,
  addr: 'w1.scyed.com:2134',
  status: 'restarting',
}

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

  useEffect(() => {
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
          // const cleanLog = consoleLine.replace(/\x1B\[[0-9;]*[mK]/g, ""); // Remove ANSI codes
          // setLogs(consoleLine);
          setLogs((prevLogs) => [...prevLogs, consoleLine]);
          // terminalRef.current.sendData(cleanLog);
          // console.log('consoleLine: ', consoleLine)
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

    const startWebSocket = async () => {
      const wsCred = await webSocket(server, ptApiKey);
      wsCreds.current = wsCred;

      console.log('socket and token: ', wsCred?.data.socket, wsCred?.data.token);

      const ws: WebSocket = new WebSocket(wsCred?.data.socket);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to WebSocket");


        ws.send(JSON.stringify({
          event: "auth",
          args: [wsCred?.data.token], // token as an array element
        }));

        if (ws.OPEN) {

        }
      };

      ws.onmessage = (ev: MessageEvent) => {
        handleWsMessage(ev.data);
      }
    }

    startWebSocket();

    return () => {
      wsRef.current?.close();
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

      <Grid container spacing={2}>
        <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
          <Card className="p-2">
            <Breadcrumb separator="›" aria-label="breadcrumbs">
              <Link color="primary" href="/gameserver">
                <Server /> &nbsp; <p className="text-foreground">Gameservers</p>
              </Link>

              <p>
                <Gamepad2Icon /> &nbsp; <p className="text-foreground">{server}</p>
              </p>
            </Breadcrumb>
          </Card>
        </Grid>



        <Grid sx={{ flexGrow: 1 }}>
          <CopyAddress settings={settings} />
        </Grid>
        <Grid sx={{ flexGrow: 1 }}>
          <Status state={serverStats?.state} />
        </Grid>
        <Grid sx={{ flexGrow: 1 }}>
          <PowerBtns loading={loading} onStop={handleStop} onStart={handleStart} onKill={handleKill} onRestart={handleRestart} state={serverStats?.state} />
        </Grid>
        <Grid xs={12} sx={{ flexGrow: 1 }}>
          {/* <NewConsole ref={terminalRef} /> */}
          <ConsoleV2 logs={logs} handleCommand={handleCommand} />
        </Grid>

        <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
          <Info settings={settings} />
        </Grid>
      </Grid >

      <Grid container spacing={2}>
        {/* Left Side: CPU Chart (Takes 50%) */}
        <Grid xs={12} md={6}>
          <CPUChart newData={serverStats} />
        </Grid>

        {/* Right Side: RAM Gauge (Takes 50%) */}
        <Grid xs={12} md={6} >
          <div className="w-full">
            <RAMChart newData={serverStats} />
          </div>
        </Grid>
      </Grid>


      <div>
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