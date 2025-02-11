"use client"

import { Textarea } from "@mui/joy"
import { useEffect, useState } from "react"



function Console() {
  const [logs, setLogs] = useState('Test log');

  useEffect(() => {
    const ws = new WebSocket('');
  })

  return (
    <>
        <Textarea minRows={10} placeholder="Server Console" value={logs }/>
    </>
  )
}

export default Console