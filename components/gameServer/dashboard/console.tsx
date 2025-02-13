"use client"

import webSocket from "@/lib/Pterodactyl/webSocket";
import { Textarea } from "@mui/joy"
import { useEffect, useState } from "react"

interface serevrProps {
  server: string;
  ptApiKey: string;
}

function Console({ server, ptApiKey }: serevrProps) {
  const [logs, setLogs] = useState('Test log');

  useEffect(() => {
    let ws: WebSocket;

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
    }

    startWebSocket();
  }, []);

  return (
    <>
      <Textarea minRows={10} placeholder="Server Console" value={logs} />
    </>
  )
}

export default Console