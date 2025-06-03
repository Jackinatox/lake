"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import "@xterm/xterm/css/xterm.css" // Import CSS statically (safe for SSR)
// Remove top-level xterm JS imports to avoid SSR issues
// import { Terminal } from "@xterm/xterm"
// import { FitAddon } from "@xterm/addon-fit"

interface ConsoleV2Props {
  logs: string[]
  handleCommand: (command: string) => void
}

const ConsoleV2 = ({ handleCommand, logs }: ConsoleV2Props) => {
  // Reference to the container for xterm
  const terminalRef = useRef<HTMLDivElement>(null)
  const lastLogRef = useRef<string[]>([])

  // State for terminal and fitAddon, initialized after dynamic import
  const [terminal, setTerminal] = useState<any>(null)
  const [fitAddon, setFitAddon] = useState<any>(null)

  // Command history state for arrow-key navigation
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Dynamically import xterm and FitAddon only on client
  useEffect(() => {
    let term: any
    let fit: any
    let isMounted = true
    const loadTerminal = async () => {
      const xtermPkg = await import("@xterm/xterm")
      const fitPkg = await import("@xterm/addon-fit")
      term = new xtermPkg.Terminal({
        cursorBlink: false,
        fontSize: 14,
        scrollback: 400,
        fontFamily: '"Fira Code", monospace',
        fontWeight: "normal",
        lineHeight: 1.2,
        letterSpacing: 0,
        allowTransparency: true,
        theme: {
          background: "#1e1e1e",
          foreground: "#f0f0f0",
          cursor: "#ffffff",
          cursorAccent: "#000000",
          black: "#000000",
          red: "#cd3131",
          green: "#0dbc79",
          yellow: "#e5e510",
          blue: "#2472c8",
          magenta: "#bc3fbc",
          cyan: "#11a8cd",
          white: "#e5e5e5",
          brightBlack: "#666666",
          brightRed: "#f14c4c",
          brightGreen: "#23d18b",
          brightYellow: "#f5f543",
          brightBlue: "#3b8eea",
          brightMagenta: "#d670d6",
          brightCyan: "#29b8db",
          brightWhite: "#e5e5e5",
        },
      })
      fit = new fitPkg.FitAddon()
      if (isMounted) {
        setTerminal(term)
        setFitAddon(fit)
      }
    }
    loadTerminal()
    return () => {
      isMounted = false
      if (term) term.dispose()
    }
  }, [])

  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    // Navigate history: ArrowUp
    if (e.key === "ArrowUp") {
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
      setHistoryIndex(newIndex)
      input.value = commandHistory[newIndex] || ""
      e.preventDefault()
    }
    // Navigate history: ArrowDown
    if (e.key === "ArrowDown") {
      const newIndex = Math.max(historyIndex - 1, -1)
      setHistoryIndex(newIndex)
      input.value = commandHistory[newIndex] || ""
      e.preventDefault()
    }
    // When Enter is pressed, capture and process the command
    if (e.key === "Enter" && input.value.trim().length > 0) {
      const command = input.value.trim()
      // Write the command in a bold, colored style (emulating the prelude in the original)
      //   terminal.write(`\u001b[1m\u001b[33m>`);
      // Output a custom log message (you can customize this as desired)
      //   terminal.writeln(`Custom Log: Command received -> ${command}`);
      handleCommand(command)
      // terminal.write(`\u001b[0m`);
      // Update command history (limit to last 32 commands)
      setCommandHistory((prev) => [command, ...prev].slice(0, 32))
      setHistoryIndex(-1)
      // Clear the input for the next command
      input.value = ""
    }
  }

  // Initialize and display the terminal once the container is ready
  useEffect(() => {
    if (terminal && fitAddon && terminalRef.current) {
      terminal.loadAddon(fitAddon)
      terminal.open(terminalRef.current)
      fitAddon.fit()
    }
  }, [terminal, fitAddon])

  // Resize terminal on window resize
  useEffect(() => {
    if (!fitAddon) return
    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [fitAddon])

  useEffect(() => {
    if (!terminal) return
    const newLogs = logs.slice(lastLogRef.current.length).filter((log) => log.trim() !== "") // Get only new logs and filter out empty strings
    if (newLogs.length > 0) {
      newLogs.forEach((log) => terminal.writeln(log)) // Append each log entry
      lastLogRef.current = logs // Update the last known log state
    }
  }, [logs, terminal])

  return (
    <div className="h-full flex flex-col">
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          minHeight: 0,
          height: "400px", // Set a fixed or max height as needed
          width: "100%",
          backgroundColor: "#1e1e1e",
          padding: "10px",
          borderTopRightRadius: "5px",
          borderTopLeftRadius: "5px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          overflow: "hidden", // Prevent scrolling inside the terminal
        }}
        onWheel={(e) => {
          e.stopPropagation()
              e.preventDefault()
        }}
      />
      <input
        type="text"
        placeholder="Type a command..."
        onKeyDown={handleCommandKeyDown}
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: "16px",
          backgroundColor: "#2a2a2a",
          color: "#f0f0f0",
          border: "none",
          borderTop: "1px solid #3a3a3a",
          outline: "none",
          fontFamily: '"Fira Code", monospace',
          borderBottomRightRadius: "5px",
          borderBottomLeftRadius: "5px",
        }}
      />
    </div>
  )
}

export default ConsoleV2
