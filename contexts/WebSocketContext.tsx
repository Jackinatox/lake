'use client';

import React, {
    createContext,
    useContext,
    useRef,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { env } from 'next-runtime-env';
import { formatBytes } from '@/lib/GlobalFunctions/ptResourceLogic';

// ============================================================================
// Types
// ============================================================================

export type ReadyState = 'CONNECTING' | 'AUTHENTICATING' | 'OPEN' | 'CLOSING' | 'CLOSED';
export type ServerStatus = 'offline' | 'starting' | 'stopping' | 'running' | 'unknown';

export type StatsPayload = {
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

// Event types that can be subscribed to
export type SocketEvent =
    | 'CONSOLE_OUTPUT'
    | 'STATS_UPDATE'
    | 'SERVER_STATUS'
    | 'CONNECTION_STATE'
    | 'AUTH_SUCCESS'
    | 'CUSTOM_EVENT';

export type CustomEventType = 'EULA' | 'HYTALE_OAUTH';

export interface SocketEventPayload {
    CONSOLE_OUTPUT: string;
    STATS_UPDATE: StatsPayload;
    SERVER_STATUS: ServerStatus;
    CONNECTION_STATE: { state: ReadyState; isReconnecting: boolean; reconnectAttempt: number };
    AUTH_SUCCESS: void;
    CUSTOM_EVENT: { type: CustomEventType; data: any };
}

type EventListener<T extends SocketEvent> = (payload: SocketEventPayload[T]) => void;

interface WsCreds {
    socket: string;
    token: string;
}

// ============================================================================
// Event Emitter Class
// ============================================================================

class ServerEventEmitter {
    private listeners: Map<SocketEvent, Set<EventListener<any>>> = new Map();

    addListener<T extends SocketEvent>(event: T, callback: EventListener<T>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Return cleanup function
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    removeListener<T extends SocketEvent>(event: T, callback: EventListener<T>): void {
        this.listeners.get(event)?.delete(callback);
    }

    emit<T extends SocketEvent>(event: T, payload: SocketEventPayload[T]): void {
        this.listeners.get(event)?.forEach((callback) => {
            try {
                callback(payload);
            } catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }

    getListenerCount(event?: SocketEvent): number {
        if (event) {
            return this.listeners.get(event)?.size ?? 0;
        }
        let total = 0;
        this.listeners.forEach((set) => (total += set.size));
        return total;
    }

    clear(): void {
        this.listeners.clear();
    }
}

// ============================================================================
// Connection Manager (Singleton per server)
// ============================================================================

interface ConnectionState {
    wsState: ReadyState;
    serverStatus: ServerStatus;
    stats: StatsPayload;
    consoleHistory: string[];
    isReconnecting: boolean;
    reconnectAttempt: number;
    initialContentLoaded: boolean;
}

const MAX_CONSOLE_HISTORY = 1000;

class ServerConnectionManager {
    private ws: WebSocket | null = null;
    private subscriberCount = 0;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private maxReconnectAttempts = 10;
    private debug = false;
    private onCleanup?: () => void;

    public emitter = new ServerEventEmitter();
    public state: ConnectionState = {
        wsState: 'CLOSED',
        serverStatus: 'unknown',
        stats: null,
        consoleHistory: [],
        isReconnecting: false,
        reconnectAttempt: 0,
        initialContentLoaded: false,
    };

    constructor(
        private serverId: string,
        private apiKey: string,
        options?: { debug?: boolean; maxReconnectAttempts?: number; onCleanup?: () => void },
    ) {
        this.debug = options?.debug ?? false;
        this.maxReconnectAttempts = options?.maxReconnectAttempts ?? 10;
        this.onCleanup = options?.onCleanup;
    }

    subscribe(): () => void {
        this.subscriberCount++;
        if (this.debug) {
            console.log(`[WS ${this.serverId}] Subscriber added. Count: ${this.subscriberCount}`);
        }

        // Connect if first subscriber
        if (this.subscriberCount === 1) {
            this.connect();
        }

        // Return unsubscribe function
        return () => {
            this.subscriberCount--;
            if (this.debug) {
                console.log(
                    `[WS ${this.serverId}] Subscriber removed. Count: ${this.subscriberCount}`,
                );
            }

            // Disconnect if no subscribers left
            if (this.subscriberCount === 0) {
                this.disconnect();
            }
        };
    }

    private async connect(): Promise<void> {
        if (this.state.isReconnecting) return;

        // Cleanup existing connection
        this.cleanupWebSocket();

        try {
            this.updateState({ wsState: 'CONNECTING' });

            if (this.debug) {
                console.log(`[WS ${this.serverId}] Fetching credentials...`);
            }

            const { socket, token } = await this.fetchCredentials();

            if (this.debug) {
                console.log(`[WS ${this.serverId}] Connecting to WebSocket...`);
            }

            const ws = new WebSocket(socket);
            this.ws = ws;

            ws.onopen = () => {
                this.updateState({
                    wsState: 'AUTHENTICATING',
                    isReconnecting: false,
                    reconnectAttempt: 0,
                });
                this.clearReconnectTimeout();

                // Authenticate
                ws.send(JSON.stringify({ event: 'auth', args: [token] }));
            };

            ws.onmessage = (message) => {
                const data = JSON.parse(message.data);
                this.handleMessage(data);
            };

            ws.onclose = (event) => {
                this.updateState({ wsState: 'CLOSED' });

                if (this.debug) {
                    console.log(`[WS ${this.serverId}] Closed:`, event.code, event.reason);
                }

                // Only reconnect if we still have subscribers and not a clean close
                if (
                    this.subscriberCount > 0 &&
                    event.code !== 1000 &&
                    this.state.reconnectAttempt < this.maxReconnectAttempts
                ) {
                    this.scheduleReconnect();
                }
            };

            ws.onerror = (error) => {
                if (this.debug) {
                    console.error(`[WS ${this.serverId}] Error:`, error);
                }
                this.updateState({ wsState: 'CLOSED' });
            };
        } catch (error) {
            if (this.debug) {
                console.error(`[WS ${this.serverId}] Connection failed:`, error);
            }
            this.updateState({ wsState: 'CLOSED' });

            // Retry if we still have subscribers
            if (
                this.subscriberCount > 0 &&
                this.state.reconnectAttempt < this.maxReconnectAttempts
            ) {
                this.scheduleReconnect();
            }
        }
    }

    private handleMessage(data: { event: string; args: any[] }): void {
        if (this.debug) {
            console.log(`[WS ${this.serverId}] Event:`, data.event);
        }

        switch (data.event) {
            case 'auth success':
                this.updateState({ wsState: 'OPEN' });
                this.emitter.emit('AUTH_SUCCESS', undefined);

                // Request initial logs if not loaded
                if (!this.state.initialContentLoaded) {
                    this.ws?.send(JSON.stringify({ event: 'send logs' }));
                    this.updateState({ initialContentLoaded: true });
                }
                break;

            case 'console output':
                const line: string = data.args[0];

                // Add to history with circular buffer
                const newHistory = [...this.state.consoleHistory, line];
                if (newHistory.length > MAX_CONSOLE_HISTORY) {
                    newHistory.shift();
                }
                this.state.consoleHistory = newHistory;

                // Emit event
                this.emitter.emit('CONSOLE_OUTPUT', line);

                // Check for custom events
                this.detectCustomEvents(line);
                break;

            case 'stats':
                const stats = this.parseStatsPayload(JSON.parse(data.args[0]));
                this.updateState({ stats });
                this.emitter.emit('STATS_UPDATE', stats);
                break;

            case 'token expiring':
                this.refreshToken();
                break;

            case 'status':
                const status = data.args[0];
                const validStatuses: ServerStatus[] = [
                    'offline',
                    'starting',
                    'stopping',
                    'running',
                ];
                const serverStatus = validStatuses.includes(status)
                    ? (status as ServerStatus)
                    : 'unknown';
                this.updateState({ serverStatus });
                this.emitter.emit('SERVER_STATUS', serverStatus);
                break;
        }
    }

    private detectCustomEvents(line: string): void {
        // EULA detection
        if (line.includes('You need to agree to the EULA in order to run the server.')) {
            this.emitter.emit('CUSTOM_EVENT', { type: 'EULA', data: null });
        }

        // Hytale OAuth detection
        const hytaleMatch = line.match(
            /https:\/\/oauth\.accounts\.hytale\.com\/oauth2\/device\/verify\?user_code=(.*)/i,
        );
        if (hytaleMatch) {
            this.emitter.emit('CUSTOM_EVENT', { type: 'HYTALE_OAUTH', data: { url: line } });
        }
    }

    private async refreshToken(): Promise<void> {
        try {
            const { token } = await this.fetchCredentials();
            this.ws?.send(JSON.stringify({ event: 'auth', args: [token] }));
        } catch (error) {
            if (this.debug) {
                console.error(`[WS ${this.serverId}] Token refresh failed, forcing reconnect:`, error);
            }
            // Token refresh failed - close connection and let reconnect logic handle it
            this.cleanupWebSocket();
            this.updateState({ wsState: 'CLOSED' });
            if (this.subscriberCount > 0 && this.state.reconnectAttempt < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            }
        }
    }

    private scheduleReconnect(): void {
        if (this.state.isReconnecting || this.reconnectTimeout) return;

        const attempt = this.state.reconnectAttempt + 1;
        const delay = Math.min(1000 * 2 ** attempt, 30000);

        this.updateState({ isReconnecting: true, reconnectAttempt: attempt });

        if (this.debug) {
            console.log(
                `[WS ${this.serverId}] Reconnecting in ${delay}ms (attempt ${attempt}/${this.maxReconnectAttempts})`,
            );
        }

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.updateState({ isReconnecting: false });
            this.connect();
        }, delay);
    }

    private clearReconnectTimeout(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    private disconnect(): void {
        if (this.debug) {
            console.log(`[WS ${this.serverId}] Disconnecting (no subscribers)`);
        }

        this.clearReconnectTimeout();
        this.cleanupWebSocket();
        this.emitter.clear();
        this.updateState({
            wsState: 'CLOSED',
            isReconnecting: false,
            reconnectAttempt: 0,
        });

        // Notify registry to remove this manager
        this.onCleanup?.();
    }

    private cleanupWebSocket(): void {
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onclose = null;
            this.ws.onerror = null;

            if (
                this.ws.readyState === WebSocket.OPEN ||
                this.ws.readyState === WebSocket.CONNECTING
            ) {
                this.ws.close(1000, 'Cleanup');
            }
            this.ws = null;
        }
    }

    private updateState(partial: Partial<ConnectionState>): void {
        Object.assign(this.state, partial);

        // Emit connection state changes
        if ('wsState' in partial || 'isReconnecting' in partial || 'reconnectAttempt' in partial) {
            this.emitter.emit('CONNECTION_STATE', {
                state: this.state.wsState,
                isReconnecting: this.state.isReconnecting,
                reconnectAttempt: this.state.reconnectAttempt,
            });
        }
    }

    private async fetchCredentials(): Promise<WsCreds> {
        const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
        const response = await fetch(`${ptUrl}/api/client/servers/${this.serverId}/websocket`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Credentials fetch failed: ${response.status}`);
        }

        const data = await response.json();
        return { socket: data.data.socket, token: data.data.token };
    }

    private parseStatsPayload(data: any): StatsPayload {
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

    // Public methods for sending commands
    sendCommand(command: string): boolean {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ event: 'send command', args: [command] }));
            return true;
        }
        return false;
    }

    sendPowerAction(action: 'start' | 'stop' | 'restart' | 'kill'): boolean {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ event: 'set state', args: [action] }));
            return true;
        }
        return false;
    }

    // Handle visibility changes
    handleVisibilityChange(): void {
        if (
            document.visibilityState === 'visible' &&
            this.subscriberCount > 0 &&
            this.ws?.readyState !== WebSocket.OPEN &&
            this.ws?.readyState !== WebSocket.CONNECTING &&
            !this.state.isReconnecting
        ) {
            if (this.debug) {
                console.log(`[WS ${this.serverId}] Page visible, reconnecting...`);
            }
            this.updateState({ reconnectAttempt: 0 });
            this.connect();
        }
    }
}

// ============================================================================
// Connection Manager Registry (manages multiple server connections)
// ============================================================================

const connectionRegistry = new Map<string, ServerConnectionManager>();

function getConnectionManager(
    serverId: string,
    apiKey: string,
    options?: { debug?: boolean },
): ServerConnectionManager {
    const key = `${serverId}:${apiKey}`;

    if (!connectionRegistry.has(key)) {
        const manager = new ServerConnectionManager(serverId, apiKey, {
            ...options,
            onCleanup: () => {
                // Remove from registry when all subscribers disconnect
                connectionRegistry.delete(key);
                if (options?.debug) {
                    console.log(`[WS Registry] Removed manager for ${serverId}`);
                }
            },
        });
        connectionRegistry.set(key, manager);
    }

    return connectionRegistry.get(key)!;
}

// ============================================================================
// React Context
// ============================================================================

interface WebSocketContextValue {
    manager: ServerConnectionManager;
    serverId: string;
    apiKey: string;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface WebSocketProviderProps {
    serverId: string;
    apiKey: string;
    debug?: boolean;
    children: React.ReactNode;
}

export function WebSocketProvider({
    serverId,
    apiKey,
    debug = false,
    children,
}: WebSocketProviderProps) {
    const manager = useMemo(
        () => getConnectionManager(serverId, apiKey, { debug }),
        [serverId, apiKey, debug],
    );

    // Subscribe on mount, unsubscribe on unmount
    useEffect(() => {
        const unsubscribe = manager.subscribe();

        const handleVisibility = () => manager.handleVisibilityChange();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            unsubscribe();
        };
    }, [manager]);

    const value = useMemo(() => ({ manager, serverId, apiKey }), [manager, serverId, apiKey]);

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

// ============================================================================
// Hook to access context
// ============================================================================

export function useWebSocketContext(): WebSocketContextValue {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
}

export function useCreds() {
    const context = useWebSocketContext();
    return { serverId: context.serverId, apiKey: context.apiKey };
}
