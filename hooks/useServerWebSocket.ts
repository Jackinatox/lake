'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    useWebSocketContext,
    ReadyState,
    ServerStatus,
    StatsPayload,
    SocketEventPayload,
    CustomEventType,
} from '@/contexts/WebSocketContext';

// ============================================================================
// useConnectionState - Connection status and reconnection info
// ============================================================================

export interface ConnectionState {
    wsState: ReadyState;
    isReconnecting: boolean;
    reconnectAttempt: number;
    isConnected: boolean;
    isLoading: boolean;
}

export function useConnectionState(): ConnectionState {
    const { manager } = useWebSocketContext();
    const [state, setState] = useState<ConnectionState>(() => ({
        wsState: manager.state.wsState,
        isReconnecting: manager.state.isReconnecting,
        reconnectAttempt: manager.state.reconnectAttempt,
        isConnected: manager.state.wsState === 'OPEN',
        isLoading:
            manager.state.wsState === 'CONNECTING' || manager.state.wsState === 'AUTHENTICATING',
    }));

    useEffect(() => {
        const unsubscribe = manager.emitter.addListener(
            'CONNECTION_STATE',
            (payload: SocketEventPayload['CONNECTION_STATE']) => {
                setState({
                    wsState: payload.state,
                    isReconnecting: payload.isReconnecting,
                    reconnectAttempt: payload.reconnectAttempt,
                    isConnected: payload.state === 'OPEN',
                    isLoading: payload.state === 'CONNECTING' || payload.state === 'AUTHENTICATING',
                });
            },
        );

        return unsubscribe;
    }, [manager]);

    return state;
}

// ============================================================================
// useServerStatus - Server power state (running, stopped, etc.)
// ============================================================================

export function useServerStatus(): ServerStatus {
    const { manager } = useWebSocketContext();
    const [status, setStatus] = useState<ServerStatus>(() => manager.state.serverStatus);

    useEffect(() => {
        // Sync initial state
        setStatus(manager.state.serverStatus);

        const unsubscribe = manager.emitter.addListener('SERVER_STATUS', setStatus);
        return unsubscribe;
    }, [manager]);

    return status;
}

// ============================================================================
// useServerStats - Real-time server resource stats
// ============================================================================

export function useServerStats(): StatsPayload {
    const { manager } = useWebSocketContext();
    const [stats, setStats] = useState<StatsPayload>(() => manager.state.stats);

    useEffect(() => {
        const unsubscribe = manager.emitter.addListener('STATS_UPDATE', setStats);
        return unsubscribe;
    }, [manager]);

    return stats;
}

// ============================================================================
// useConsoleOutput - Console log stream with history
// ============================================================================

export interface UseConsoleOutputOptions {
    /** If true, includes the existing history buffer on mount */
    includeHistory?: boolean;
    /** Maximum lines to keep in local state (default: 1000) */
    maxLines?: number;
}

export interface ConsoleOutput {
    /** Current sliding window of console lines (at most maxLines entries) */
    logs: string[];
    totalLines: number;
}

export function useConsoleOutput(options: UseConsoleOutputOptions = {}): ConsoleOutput {
    const { includeHistory = true, maxLines = 1000 } = options;
    const { manager } = useWebSocketContext();
    const [state, setState] = useState<ConsoleOutput>(() => {
        const initial = includeHistory ? [...manager.state.consoleHistory] : [];
        return { logs: initial, totalLines: initial.length };
    });

    useEffect(() => {
        // Reset with history if option enabled
        const initial = includeHistory ? [...manager.state.consoleHistory] : [];
        setState({ logs: initial, totalLines: initial.length });

        const unsubscribe = manager.emitter.addListener('CONSOLE_OUTPUT', (line: string) => {
            setState((prev) => {
                // Avoid duplicates of the immediately preceding line
                if (prev.logs[prev.logs.length - 1] === line) return prev;

                // Append, trimming the oldest line from the front once capped so the
                // window stays at maxLines.
                const newLogs =
                    prev.logs.length >= maxLines
                        ? [...prev.logs.slice(prev.logs.length - maxLines + 1), line]
                        : [...prev.logs, line];

                return { logs: newLogs, totalLines: prev.totalLines + 1 };
            });
        });

        return unsubscribe;
    }, [manager, includeHistory, maxLines]);

    return state;
}

// ============================================================================
// useConsoleListener - Subscribe to console output with callback
// ============================================================================

export function useConsoleListener(callback: (line: string) => void): void {
    const { manager } = useWebSocketContext();
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const unsubscribe = manager.emitter.addListener('CONSOLE_OUTPUT', (line: string) => {
            callbackRef.current(line);
        });

        return unsubscribe;
    }, [manager]);
}

// ============================================================================
// useCustomEvent - Subscribe to custom events (EULA, Hytale OAuth, etc.)
// ============================================================================

export function useCustomEvent(
    eventType: CustomEventType | CustomEventType[],
    callback: (data: any) => void,
): void {
    const { manager } = useWebSocketContext();
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];

    useEffect(() => {
        const unsubscribe = manager.emitter.addListener(
            'CUSTOM_EVENT',
            (payload: SocketEventPayload['CUSTOM_EVENT']) => {
                if (eventTypes.includes(payload.type)) {
                    callbackRef.current(payload.data);
                }
            },
        );

        return unsubscribe;
    }, [manager, ...eventTypes]);
}

// ============================================================================
// useSendCommand - Send commands to the server
// ============================================================================

export interface SendCommandActions {
    sendCommand: (command: string) => boolean;
    sendPowerAction: (action: 'start' | 'stop' | 'restart' | 'kill') => boolean;
}

export function useSendCommand(): SendCommandActions {
    const { manager } = useWebSocketContext();

    const sendCommand = useCallback((command: string) => manager.sendCommand(command), [manager]);

    const sendPowerAction = useCallback(
        (action: 'start' | 'stop' | 'restart' | 'kill') => manager.sendPowerAction(action),
        [manager],
    );

    return { sendCommand, sendPowerAction };
}

// ============================================================================
// useInitialContentLoaded - Check if initial console history is loaded
// ============================================================================

export function useInitialContentLoaded(): boolean {
    const { manager } = useWebSocketContext();
    const [loaded, setLoaded] = useState(() => manager.state.initialContentLoaded);

    useEffect(() => {
        const unsubscribe = manager.emitter.addListener('AUTH_SUCCESS', () => {
            // Small delay to allow logs to arrive
            setTimeout(() => setLoaded(true), 100);
        });

        return unsubscribe;
    }, [manager]);

    return loaded;
}

// ============================================================================
// Composite hook for backwards compatibility / convenience
// ============================================================================

export interface UseServerWebSocketReturn {
    // Connection
    wsState: ReadyState;
    isConnected: boolean;
    isLoading: boolean;
    isReconnecting: boolean;
    reconnectAttempt: number;

    // Server state
    serverStatus: ServerStatus;
    stats: StatsPayload;
    initialContentLoaded: boolean;

    // Console
    consoleOutput: string[];
    /** Total console lines ever emitted (keeps growing past the sliding-window cap) */
    consoleTotalLines: number;

    // Actions
    sendCommand: (command: string) => boolean;
    sendPowerAction: (action: 'start' | 'stop' | 'restart' | 'kill') => boolean;
}

export function useServerWebSocket(): UseServerWebSocketReturn {
    const connection = useConnectionState();
    const serverStatus = useServerStatus();
    const stats = useServerStats();
    const consoleOutput = useConsoleOutput();
    const initialContentLoaded = useInitialContentLoaded();
    const { logs: consoleLogs, totalLines: consoleTotalLines } = consoleOutput;
    const { sendCommand, sendPowerAction } = useSendCommand();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const autoStart = useRef(searchParams?.get('start') === 'true');

    const clearAutoStartParam = useCallback(() => {
        if (!searchParams?.has('start')) return;
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete('start');
        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, [pathname, router, searchParams]);

    useEffect(() => {
        if (!autoStart.current) return;
        if (!connection.isConnected) return;
        if (serverStatus === 'running' || serverStatus === 'starting') {
            autoStart.current = false;
            clearAutoStartParam();
            return;
        }
        if (serverStatus !== 'offline') return;

        autoStart.current = false;
        sendPowerAction('start');
        clearAutoStartParam();
    }, [clearAutoStartParam, connection.isConnected, serverStatus, sendPowerAction]);

    return {
        wsState: connection.wsState,
        isConnected: connection.isConnected,
        isLoading: connection.isLoading,
        isReconnecting: connection.isReconnecting,
        reconnectAttempt: connection.reconnectAttempt,
        serverStatus,
        stats,
        initialContentLoaded,
        consoleOutput: consoleLogs,
        consoleTotalLines,
        sendCommand,
        sendPowerAction,
    };
}
