"use client"

import { Textarea } from "@mui/joy"
import { useEffect, useRef } from "react";

interface serverProps {
  logs: string;
}



function Console({ logs }: serverProps) {

  return (
    <>
      <Textarea
        minRows={20}
        maxRows={20}
        placeholder="Server Console"
        value={logs}
        readOnly
        sx={{
          overflowY: 'auto',
          scrollBehavior: 'smooth',
        }}
      />
    </>
  )
}

export default Console