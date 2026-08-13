'use client';

import { useEffect, useRef, useState, useCallback, KeyboardEvent, useMemo } from 'react';
import { Send, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AnsiToHtml from 'ansi-to-html';
import { MAX_CONSOLE_HISTORY, useWebSocketContext } from '@/contexts/WebSocketContext';
import { useConnectionState, useSendCommand } from '@/hooks/useServerWebSocket';

// Class applied to every rendered log line. Kept as a module constant so a batch can
// be built as one HTML string and parsed in a single pass.
const LOG_LINE_CLASS =
    'text-zinc-300 whitespace-pre-wrap break-all hover:bg-zinc-900/50 px-1 -mx-1 rounded select-text';

const ConsoleV2 = () => {
    const { manager } = useWebSocketContext();
    const { isConnected } = useConnectionState();
    const { sendCommand } = useSendCommand();
    const disabled = !isConnected;

    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [tempInput, setTempInput] = useState(''); // Current input stashed while browsing history
    // Drives the "No output yet" placeholder. Flipped at most once per mount, never per line.
    const [hasOutput, setHasOutput] = useState(() => manager.state.consoleHistory.length > 0);

    const isAtBottomRef = useRef(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Initialize ANSI to HTML converter
    const ansiConverter = useMemo(
        () =>
            new AnsiToHtml({
                fg: '#e4e4e7', // zinc-200
                bg: '#18181b', // zinc-950
                newline: false,
                escapeXML: true,
                stream: false,
            }),
        [],
    );

    // Check if user is scrolled to bottom (with small threshold for tolerance)
    const checkIfAtBottom = useCallback(() => {
        const container = scrollAreaRef.current;
        if (!container) return true;

        const threshold = 50; // px tolerance
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    }, []);

    // Handle scroll events to track if user is at bottom
    const handleScroll = useCallback(() => {
        isAtBottomRef.current = checkIfAtBottom();
    }, [checkIfAtBottom]);

    // ------------------------------------------------------------------
    // Console rendering — fully imperative and decoupled from React state.
    //
    // Console lines can arrive in bursts of hundreds per second. Routing each line
    // through React state would re-render the whole dashboard once per line, which is
    // what made the page sluggish and made logs land in stuttery chunks. Instead we
    // subscribe straight to the connection manager's stream, buffer incoming lines,
    // and flush them to the DOM a single time per animation frame. A burst of N lines
    // collapses into one DOM write and zero React renders.
    // ------------------------------------------------------------------
    useEffect(() => {
        const container = logContainerRef.current;
        const scrollContainer = scrollAreaRef.current;
        if (!container || !scrollContainer) return;

        const linesToHtml = (lines: string[]) =>
            lines
                .map((line) => `<div class="${LOG_LINE_CLASS}">${ansiConverter.toHtml(line)}</div>`)
                .join('');

        // Keep the DOM bounded to the same window as the history buffer by dropping the
        // oldest (offscreen) nodes.
        const trimToWindow = () => {
            let excess = container.childElementCount - MAX_CONSOLE_HISTORY;
            while (excess-- > 0 && container.firstChild) {
                container.removeChild(container.firstChild);
            }
        };

        // Seed from existing history (first mount, or remount after a tab switch).
        const history = manager.state.consoleHistory;
        container.innerHTML = linesToHtml(history);
        trimToWindow();
        let lastLine = history[history.length - 1];
        let rendered = history.length > 0;
        if (rendered) {
            setHasOutput(true);
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            isAtBottomRef.current = true;
        }

        // Live stream → buffer → flush once per frame.
        const buffer: string[] = [];
        let frame: number | null = null;

        const flush = () => {
            frame = null;
            if (buffer.length === 0) return;

            const batch = buffer.splice(0, buffer.length);
            container.insertAdjacentHTML('beforeend', linesToHtml(batch));
            trimToWindow();

            // Auto-scroll only when pinned to bottom and no text is selected
            if (isAtBottomRef.current && !window.getSelection()?.toString()) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
            if (!rendered) {
                rendered = true;
                setHasOutput(true);
            }
        };

        const unsubscribe = manager.emitter.addListener('CONSOLE_OUTPUT', (line: string) => {
            // Drop a line identical to the one immediately before it (occasional double-emit)
            if (line === lastLine) return;
            lastLine = line;

            buffer.push(line);
            // Never hold more backlog than the visible window can show — relevant while the
            // tab is hidden and rAF is paused, so the buffer can't grow without bound.
            if (buffer.length > MAX_CONSOLE_HISTORY * 2) {
                buffer.splice(0, buffer.length - MAX_CONSOLE_HISTORY);
            }
            if (frame === null) frame = requestAnimationFrame(flush);
        });

        return () => {
            unsubscribe();
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, [manager, ansiConverter]);

    const handleSubmit = useCallback(() => {
        const trimmedCommand = inputValue.trim();
        if (!trimmedCommand || disabled) return;

        sendCommand(trimmedCommand);

        // Add to history (avoid duplicates of the last command)
        setCommandHistory((prev) => {
            if (prev[prev.length - 1] === trimmedCommand) return prev;
            return [...prev, trimmedCommand];
        });

        setInputValue('');
        setHistoryIndex(-1);
        setTempInput('');
    }, [inputValue, sendCommand, disabled]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Don't intercept Ctrl+C - let the browser handle copy
        if (e.ctrlKey && e.key === 'c') {
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;

            if (historyIndex === -1) {
                // Save current input before navigating
                setTempInput(inputValue);
                setHistoryIndex(commandHistory.length - 1);
                setInputValue(commandHistory[commandHistory.length - 1]);
            } else if (historyIndex > 0) {
                setHistoryIndex(historyIndex - 1);
                setInputValue(commandHistory[historyIndex - 1]);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;

            if (historyIndex < commandHistory.length - 1) {
                setHistoryIndex(historyIndex + 1);
                setInputValue(commandHistory[historyIndex + 1]);
            } else {
                // Return to the temp input
                setHistoryIndex(-1);
                setInputValue(tempInput);
            }
            return;
        }
    };

    return (
        <div className="flex flex-col h-full rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                <Terminal className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-zinc-400">Console</span>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <div
                        className={cn(
                            'h-2.5 w-2.5 rounded-full',
                            disabled ? 'bg-zinc-600' : 'bg-emerald-500/80',
                        )}
                    />
                </div>
            </div>

            {/* Log Output Area */}
            <div
                ref={scrollAreaRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-3 font-mono text-sm leading-relaxed cursor-text"
            >
                {!hasOutput && <div className="text-zinc-600 italic">No output yet...</div>}
                <div ref={logContainerRef} />
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 border-t border-zinc-800">
                <span className="text-emerald-500 font-mono text-sm select-none">&gt;</span>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        // Reset history navigation when user types
                        if (historyIndex !== -1) {
                            setHistoryIndex(-1);
                            setTempInput('');
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={disabled ? 'Console disabled...' : 'Enter command...'}
                    className={cn(
                        'flex-1 bg-transparent border-none outline-none font-mono text-sm text-zinc-200 placeholder:text-zinc-600',
                        disabled && 'cursor-not-allowed opacity-50',
                    )}
                    autoComplete="off"
                    spellCheck={false}
                />
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSubmit}
                    disabled={disabled || !inputValue.trim()}
                    className="h-7 w-7 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-800"
                >
                    <Send className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};

export default ConsoleV2;
