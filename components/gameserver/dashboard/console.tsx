"use client"

import webSocket from "@/lib/Pterodactyl/webSocket";
import { Textarea } from "@mui/joy"
import { Gauge } from "@mui/x-charts";
import { useEffect, useState } from "react"

interface serverProps {
  logs: string;
}



function Console({ logs }: serverProps) {

  return (
    <>

      <Textarea sx={{ width: '80%' }} minRows={10} maxRows={20} placeholder="Server Console" value={logs} />
    </>
  )
}

export default Console