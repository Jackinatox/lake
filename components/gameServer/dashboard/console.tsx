"use client"

import webSocket from "@/lib/Pterodactyl/webSocket";
import { Textarea } from "@mui/joy"
import { Gauge } from "@mui/x-charts";
import { useEffect, useState } from "react"

interface serverProps {
  server: string;
  ptApiKey: string;
}

function Console({ server, ptApiKey }: serverProps) {
  const [logs, setLogs] = useState('Test log');
  const [cpu, setCpu] = useState<number>(0.0);
  const [mem, setMem] = useState<number>(0.0);
  const [disk, setDisk] = useState<number>(0.0);

  const [serverStats, setServerStats] = useState<any>();


  useEffect(() => {
    let ws: WebSocket;

    function handleWsMessage(msg: string) {
      const data = JSON.parse(msg);

      switch (data.event) {
        case 'stats': {
          const stats = JSON.parse(data.args[0]);
          console.log('stats: ', stats)
          setCpu(parseFloat(stats.cpu_absolute.toFixed(2)));

          const roundedStats = {
            cpu_absolute: parseFloat(stats.cpu_absolute.toFixed(2)),
            disk_bytes: parseFloat((stats.disk_bytes / 1024 / 1024).toFixed(2)),  
            memory_bytes: parseFloat((stats.memory_bytes / 1024 / 1024).toFixed(2)),
            memory_limit_bytes: parseFloat((stats.memory_limit_bytes / 1024 / 1024).toFixed(2)),
            network: {
              rx_bytes: stats.network.rx_bytes,
              tx_bytes: stats.network.tx_bytes
            },
            state: stats.state,
            uptime: stats.uptime
          }
          setServerStats(roundedStats); 
        }
      }

      setLogs(prevLogs => msg + '\n' + prevLogs);
    }

    const startWebSocket = async () => {
      const wsCreds = await webSocket(server, ptApiKey);
      console.log('socket and token: ', wsCreds?.data.socket, wsCreds?.data.token);

      ws = new WebSocket(wsCreds?.data.socket);

      ws.onopen = () => {
        console.log("Connected to WebSocket");
        ws.send(JSON.stringify({
          event: "auth",
          args: [wsCreds?.data.token], // token as an array element
        }));
      }

      ws.onmessage = (ev: MessageEvent) => {
        handleWsMessage(ev.data);
      }

    }

    startWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <>
      <Gauge
        width={200} height={200}
        value={serverStats?.cpu_absolute}
        startAngle={-120}
        endAngle={120}
        innerRadius="80%"
        outerRadius="100%"
      />
    <div>
      <p>CPU: {serverStats?.cpu_absolute} %</p>
      <p>Memory: {serverStats?.memory_bytes} MB</p>
      <p>Memory Limit: {serverStats?.memory_limit_bytes} MB</p>
      <p>Disk: {serverStats?.disk_bytes} MB</p>
      <p>Network RX: {serverStats?.network.rx_bytes} bytes</p>
      <p>Network TX: {serverStats?.network.tx_bytes} bytes</p>
      <p>State: {serverStats?.state}</p>
      <p>Uptime: {serverStats?.uptime}</p>
    </div>
      <Textarea sx={{ width: '80%' }} minRows={10} maxRows={20} placeholder="Server Console" value={logs} />
    </>
  )
}

export default Console