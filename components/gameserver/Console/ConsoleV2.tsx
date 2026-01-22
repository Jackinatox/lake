'use client';

import { useEffect, useRef, useState, useCallback, KeyboardEvent, useMemo } from 'react';
import { Send, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AnsiToHtml from 'ansi-to-html';

interface ConsoleV2Props {
    logs: string[];
    handleCommand: (command: string) => void;
    disabled?: boolean;
}

const ConsoleV2 = ({ handleCommand, logs, disabled = false }: ConsoleV2Props) => {
    const [inputValue, setInputValue] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [tempInput, setTempInput] = useState(''); // Store current input when navigating history
    const [isAtBottom, setIsAtBottom] = useState(true);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
        const isBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
        return isBottom;
    }, []);

    // Handle scroll events to track if user is at bottom
    const handleScroll = useCallback(() => {
        setIsAtBottom(checkIfAtBottom());
    }, [checkIfAtBottom]);

    // Auto-scroll to bottom when new logs arrive, only if already at bottom
    useEffect(() => {
        const container = scrollAreaRef.current;
        if (isAtBottom && container) {
            // Use scrollTop instead of scrollIntoView to avoid scrolling the whole page
            container.scrollTop = container.scrollHeight;
        }
    }, [logs, isAtBottom]);

    const handleSubmit = useCallback(() => {
        const trimmedCommand = inputValue.trim();
        if (!trimmedCommand || disabled) return;

        handleCommand(trimmedCommand);

        // Add to history (avoid duplicates of the last command)
        setCommandHistory((prev) => {
            if (prev[prev.length - 1] === trimmedCommand) return prev;
            return [...prev, trimmedCommand];
        });

        setInputValue('');
        setHistoryIndex(-1);
        setTempInput('');
    }, [inputValue, handleCommand, disabled]);

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

    // Focus input when clicking on console area
    const handleConsoleClick = () => {
        if (!disabled) {
            inputRef.current?.focus();
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
                onClick={handleConsoleClick}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3 font-mono text-sm leading-relaxed cursor-text min-h-50 max-h-75 md:max-h-100"
            >
                {logs.length === 0 ? (
                    <div className="text-zinc-600 italic">No output yet...</div>
                ) : (
                    logs.map((log, index) => (
                        <div
                            key={index}
                            className="text-zinc-300 whitespace-pre-wrap break-all hover:bg-zinc-900/50 px-1 -mx-1 rounded select-text"
                            dangerouslySetInnerHTML={{ __html: ansiConverter.toHtml(log) }}
                        />
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 border-t border-zinc-800">
                <span className="text-emerald-500 font-mono text-sm select-none">&gt;</span>
                <input
                    ref={inputRef}
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
