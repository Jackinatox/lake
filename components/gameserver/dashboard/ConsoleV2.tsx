import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface ConsoleV2Props {
    logs: string;
    handleCommand: (command: string) => void;
}

const ConsoleV2 = ({ handleCommand, logs }: ConsoleV2Props) => {
    useEffect(() => {
        terminal && terminal.writeln(logs);
    }, [logs])
    // Reference to the container for xterm
    const terminalRef = useRef<HTMLDivElement>(null);
    // Create a terminal instance (using custom properties similar to the original)
    const [terminal] = useState(
        () =>
            new Terminal({
                cursorBlink: true,
                fontSize: 14,
                fontFamily: 'monospace',
                theme: {
                    background: '#000000',
                    foreground: '#ffffff',
                },
            })
    );
    const fitAddon = new FitAddon();

    // Command history state for arrow-key navigation
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Function to handle key events on the input
    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        // Navigate history: ArrowUp
        if (e.key === 'ArrowUp') {
            const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
            setHistoryIndex(newIndex);
            input.value = commandHistory[newIndex] || '';
            e.preventDefault();
        }
        // Navigate history: ArrowDown
        if (e.key === 'ArrowDown') {
            const newIndex = Math.max(historyIndex - 1, -1);
            setHistoryIndex(newIndex);
            input.value = commandHistory[newIndex] || '';
            e.preventDefault();
        }
        // When Enter is pressed, capture and process the command
        if (e.key === 'Enter' && input.value.trim().length > 0) {
            const command = input.value.trim();
            // Write the command in a bold, colored style (emulating the prelude in the original)
            //   terminal.write(`\u001b[1m\u001b[33m>`);
            // Output a custom log message (you can customize this as desired)
            //   terminal.writeln(`Custom Log: Command received -> ${command}`);
            handleCommand(command);
            // terminal.write(`\u001b[0m`);
            // Update command history (limit to last 32 commands)
            setCommandHistory((prev) => [command, ...prev].slice(0, 32));
            setHistoryIndex(-1);
            // Clear the input for the next command
            input.value = '';
        }
    };

    // Initialize and display the terminal once the container is ready
    useEffect(() => {
        if (terminalRef.current) {
            terminal.loadAddon(fitAddon);
            terminal.open(terminalRef.current);
            fitAddon.fit();
        }
    }, [terminal, fitAddon]);

    return (
        <div>
            <div
                ref={terminalRef}
                style={{ height: '300px', width: '100%', backgroundColor: '#000000' }}
            />
            <input
                type="text"
                placeholder="Type a command..."
                onKeyDown={handleCommandKeyDown}
                style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
        </div>
    );
};

export default ConsoleV2;