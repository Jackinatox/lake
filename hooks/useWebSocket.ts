import { useEffect, useRef, useState, useCallback } from 'react';
import { env } from 'next-runtime-env';
import { formatBytes } from '@/lib/GlobalFunctions/ptResourceLogic';

type ReadyState = 'CONNECTING' | 'AUTHENTICATING' | 'OPEN' | 'CLOSING' | 'CLOSED';

type CustomEvents = 'EULA';
type WsCreds = { socket: string; token: string };

//TODO: Implement
type ServerStatus = 'offline' | 'starting' | 'stopping' | 'running' | 'unknown';
type StatsPayload = {
    memory_bytes: number;
    cpu_absolute: number;
    disk_bytes: number;
    memory_limit_bytes: number;
    formated_memory: string;
    formated_memory_limit: string;
    formated_disk: string;
    network: { rx_bytes: number; tx_bytes: number };
    uptime_seconds: number;
} | null;

type UseWebSocketOptions = {
    onCustomEvent?: (evt: { event: CustomEvents; args: any[] }) => void;
    onEvent?: (evt: { event: string; args: any[] }) => void;
    debug?: boolean;
    maxReconnectAttempts?: number;
};

interface UseWebSocketReturn {
    wsState: ReadyState;
    initialContentLoaded: boolean;
    consoleOutput: string[];
    stats: StatsPayload;
    serverStatus: ServerStatus;
    handleCommand: (command: string) => void;
    handlePowerAction: (action: 'start' | 'stop' | 'restart' | 'kill') => void;
}

export function useWebSocket(
    serverId: string,
    apiKey: string,
    options: UseWebSocketOptions,
): UseWebSocketReturn {
    const [wsState, setWsState] = useState<ReadyState>('CONNECTING');
    const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');
    const [initialContentLoaded, setInitialContentLoaded] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [stats, setStats] = useState<StatsPayload>({
        cpu_absolute: 0,
        memory_bytes: 0,
        memory_limit_bytes: 0,
        formated_disk: '',
        formated_memory: '',
        formated_memory_limit: '',
        disk_bytes: 0,
        network: { rx_bytes: 0, tx_bytes: 0 },
        uptime_seconds: 0,
    });

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectCountRef = useRef<number>(0);
    const isReconnectingRef = useRef<boolean>(false);
    const maxReconnectAttempts = options?.maxReconnectAttempts ?? 10;
    const connectRef = useRef<(() => void) | null>(null);

    const handleMessage = useCallback(
        async (data: { event: string; args: any[] }) => {
            if (options?.debug) {
                console.log('WebSocket Event:', data);
            }

            switch (data.event) {
                case 'auth success':
                    setWsState('OPEN');
                    setInitialContentLoaded((loaded) => {
                        if (!loaded) {
                            wsRef.current?.send(
                                JSON.stringify({
                                    event: 'send logs',
                                }),
                            );
                        }
                        return true;
                    });
                    break;
                case 'console output':
                    const consoleLine: string = data.args[0];
                    if (
                        consoleLine.includes(
                            'You need to agree to the EULA in order to run the server.',
                        )
                    ) {
                        options.onCustomEvent?.({ event: 'EULA', args: [] });
                    }
                    setConsoleOutput((prevLogs) => {
                        if (prevLogs[prevLogs.length - 1] === consoleLine) {
                            return prevLogs; // Avoid duplicate log
                        }
                        return [...prevLogs, consoleLine];
                    });
                    break;
                case 'stats':
                    const statsPayload = parseStatsPayload(JSON.parse(data.args[0]));
                    setStats(statsPayload);
                    break;
                case 'token expiring':
                    const wsCreds = await webSocketCreds(serverId, apiKey);
                    wsRef.current?.send(JSON.stringify({ event: 'auth', args: [wsCreds.token] }));
                    break;
                case 'status': {
                    const status = data.args[0];
                    const validStatuses: ServerStatus[] = [
                        'offline',
                        'starting',
                        'stopping',
                        'running',
                    ];
                    setServerStatus(
                        validStatuses.includes(status) ? (status as ServerStatus) : 'unknown',
                    );
                    break;
                }
            }
            options.onEvent?.(data);
        },
        [options, serverId, apiKey],
    );

    const scheduleReconnect = useCallback(() => {
        if (isReconnectingRef.current || reconnectTimeoutRef.current) return;

        isReconnectingRef.current = true;
        reconnectCountRef.current += 1;
        const delay = getReconnectDelay(reconnectCountRef.current);

        if (options?.debug) {
            console.log(
                `Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current}/${maxReconnectAttempts})`,
            );
        }

        reconnectTimeoutRef.current = setTimeout(() => {
            isReconnectingRef.current = false;
            reconnectTimeoutRef.current = null;
            connectRef.current?.();
        }, delay);
    }, [maxReconnectAttempts, options]);

    const connect = useCallback(async () => {
        // Prevent multiple simultaneous connection attempts
        if (isReconnectingRef.current) return;

        // cleanup existing connection
        if (wsRef.current) {
            wsRef.current.onopen = null;
            wsRef.current.onmessage = null;
            wsRef.current.onclose = null;
            wsRef.current.onerror = null;

            if (
                wsRef.current.readyState === WebSocket.OPEN ||
                wsRef.current.readyState === WebSocket.CONNECTING
            ) {
                wsRef.current.close();
            }
        }

        try {
            if (options?.debug) {
                console.log(`Fetching WebSocket credentials for server ${serverId}...`);
            }
            const { socket, token } = await webSocketCreds(serverId, apiKey);
            if (options?.debug) {
                console.log('WebSocket credentials obtained:', { socket, token });
            }
            const ws = new WebSocket(socket);
            wsRef.current = ws;
            setWsState('CONNECTING');

            const auth = () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(
                        JSON.stringify({
                            event: 'auth',
                            args: [token],
                        }),
                    );
                }
            };

            ws.onopen = () => {
                setWsState('AUTHENTICATING');

                reconnectCountRef.current = 0;
                isReconnectingRef.current = false;
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }

                // Authenticate
                auth();
            };

            ws.onmessage = (message) => {
                const data = JSON.parse(message.data);
                handleMessage(data);
            };

            ws.onclose = (event) => {
                setWsState('CLOSED');
                if (options?.debug) {
                    console.log('WebSocket closed:', event.code, event.reason);
                }

                // Attempt to reconnect if not a clean close and under max attempts
                if (
                    event.code !== 1000 &&
                    reconnectCountRef.current < maxReconnectAttempts &&
                    !isReconnectingRef.current &&
                    !reconnectTimeoutRef.current
                ) {
                    scheduleReconnect();
                }
            };

            ws.onerror = (error) => {
                if (options?.debug) {
                    console.error('WebSocket error:', error);
                }
                setWsState('CLOSED');
            };
        } catch (error) {
            if (options?.debug) {
                console.error('Failed to connect:', error);
            }
            setWsState('CLOSED');
            // Retry connection on error
            if (
                reconnectCountRef.current < maxReconnectAttempts &&
                !isReconnectingRef.current &&
                !reconnectTimeoutRef.current
            ) {
                scheduleReconnect();
            }
        }
    }, [serverId, apiKey, options, handleMessage, maxReconnectAttempts, scheduleReconnect]);

    // Store connect in ref to break circular dependency
    useEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        // Initial connection
        let mounted = true;

        if (mounted) {
            connect();
        }

        // Handle page visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && mounted) {
                // Page became visible, check WebSocket state
                if (
                    wsRef.current?.readyState !== WebSocket.OPEN &&
                    wsRef.current?.readyState !== WebSocket.CONNECTING &&
                    !isReconnectingRef.current &&
                    !reconnectTimeoutRef.current
                ) {
                    if (options?.debug) {
                        console.log('Page became visible, reconnecting WebSocket...');
                    }
                    // Reset reconnect count when user returns to tab
                    reconnectCountRef.current = 0;
                    connect();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            mounted = false;
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            isReconnectingRef.current = false;

            if (wsRef.current) {
                wsRef.current.onopen = null;
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.onmessage = null;

                if (
                    wsRef.current.readyState === WebSocket.OPEN ||
                    wsRef.current.readyState === WebSocket.CONNECTING
                ) {
                    wsRef.current.close(1000, 'Component unmounting');
                }
            }
        };
    }, [serverId, apiKey]);

    return {
        wsState,
        initialContentLoaded,
        consoleOutput,
        stats,
        serverStatus,
        handleCommand: (command: string) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        event: 'send command',
                        args: [command],
                    }),
                );
            } else if (options?.debug) {
                console.warn('Cannot send command: WebSocket not connected');
            }
        },
        handlePowerAction: (action: 'start' | 'stop' | 'restart' | 'kill') => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                    JSON.stringify({
                        event: 'set state',
                        args: [action],
                    }),
                );
            } else if (options?.debug) {
                console.warn('Cannot send power action: WebSocket not connected');
            }
        },
    };
}

async function webSocketCreds(serverId: string, apiKey: string): Promise<WsCreds> {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const response = await fetch(`${ptUrl}/api/client/servers/${serverId}/websocket`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        console.error(response.body);
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return { socket: data.data.socket, token: data.data.token };
}

function parseStatsPayload(data: any): StatsPayload {
    if (
        typeof data !== 'object' ||
        data === null ||
        typeof data.memory_bytes !== 'number' ||
        typeof data.cpu_absolute !== 'number' ||
        typeof data.disk_bytes !== 'number' ||
        typeof data.memory_limit_bytes !== 'number' ||
        typeof data.network !== 'object' ||
        data.network === null ||
        typeof data.network.rx_bytes !== 'number' ||
        typeof data.network.tx_bytes !== 'number'
    ) {
        return null;
    }

    return {
        memory_bytes: data.memory_bytes,
        cpu_absolute: parseFloat(Number(data.cpu_absolute).toFixed(1)),
        disk_bytes: data.disk_bytes,
        memory_limit_bytes: data.memory_limit_bytes,
        network: {
            rx_bytes: data.network.rx_bytes,
            tx_bytes: data.network.tx_bytes,
        },
        uptime_seconds: data.uptime,
        formated_memory: formatBytes(data.memory_bytes),
        formated_memory_limit: formatBytes(data.memory_limit_bytes),
        formated_disk: formatBytes(data.disk_bytes),
    };
}

function getReconnectDelay(attempt: number): number {
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(1000 * 2 ** attempt, maxDelay);
    return delay;
}
