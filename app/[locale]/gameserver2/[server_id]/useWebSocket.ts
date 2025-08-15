import { useEffect, useRef, useState, useCallback } from 'react';

type ServerStatus = 'offline' | 'starting' | 'stopping' | 'running' | 'unknown';
type StatsPayload = {
  memory_bytes?: number;
  cpu_absolute?: number;
  disk_bytes?: number;
  memory_limit_bytes?: number;
  network?: { rx_bytes?: number; tx_bytes?: number };
  [k: string]: unknown;
} | null;

type UseWebSocketOptions = {
  onEvent?: (evt: { event: string; args: any[] }) => void;
  debug?: boolean;
};

export function useWebSocket(serverId: string, apiKey: string, options?: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // Avoid shadowing the global console object
  const [logs, setLogs] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');
  const [stats, setStats] = useState<StatsPayload>(null);
  const [events, setEvents] = useState<Array<{ event: string; args: any[] }>>([]);
  const [lastEvent, setLastEvent] = useState<{ event: string; args: any[] } | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(false);

  const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL || 'https://pt.scyed.com';

  const getWebSocketToken = useCallback(async () => {
    const response = await fetch(`${panelUrl}/api/client/servers/${serverId}/websocket`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/vnd.pterodactyl.v1+json'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to get WebSocket token');
    }
    
    const data = await response.json();
    return data.data;
  }, [serverId, apiKey, panelUrl]);

  const cleanupReconnectTimeout = () => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const scheduleReconnect = (delayMs: number) => {
    cleanupReconnectTimeout();
    if (!mountedRef.current) return;
    reconnectTimeoutRef.current = window.setTimeout(() => {
      // Ensure previous socket is closed before reconnecting
      try { socketRef.current?.close(); } catch {}
      connect();
    }, delayMs);
  };

  const connect = useCallback(async () => {
    try {
      const { token, socket: socketUrl } = await getWebSocketToken();
      tokenRef.current = token;

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        // Use globalThis.console to avoid any accidental shadowing
        globalThis.console?.log('WebSocket connected');
        setIsConnected(true);
        
        // Authenticate
        socket.send(JSON.stringify({
          event: 'auth',
          args: [token]
        }));
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as { event: string; args?: any[] };
        const args = Array.isArray(message.args) ? message.args : [];

        // Expose all events
        setLastEvent({ event: message.event, args });
        setEvents(prev => {
          const next = [...prev, { event: message.event, args }];
          // Keep only the latest 500 events to avoid unbounded growth
          if (next.length > 500) next.shift();
          return next;
        });
        options?.onEvent?.({ event: message.event, args });
        if (options?.debug) {
          globalThis.console?.log('[WS EVENT]', message.event, args);
        }
        
        switch (message.event) {
          case 'console output':
            setLogs(prev => [...prev, String(args?.[0] ?? '')]);
            break;
          case 'status':
            setServerStatus((args?.[0] as ServerStatus) ?? 'unknown');
            break;
          case 'stats':
            try {
              const parsed = JSON.parse(args?.[0] ?? '{}');
              setStats(parsed);
              if (options?.debug) {
                const cpu = parsed?.cpu_absolute ?? 'n/a';
                const mem = parsed?.memory_bytes ?? 'n/a';
                const memLim = parsed?.memory_limit_bytes ?? 'n/a';
                const disk = parsed?.disk_bytes ?? 'n/a';
                const rx = parsed?.network?.rx_bytes ?? 'n/a';
                const tx = parsed?.network?.tx_bytes ?? 'n/a';
                globalThis.console?.log('CPU Usage:', cpu, '%');
                globalThis.console?.log('Memory Usage:', mem, 'bytes');
                globalThis.console?.log('Memory Limit:', memLim, 'bytes');
                globalThis.console?.log('Disk Usage:', disk, 'bytes');
                globalThis.console?.log('Network RX:', rx, 'bytes');
                globalThis.console?.log('Network TX:', tx, 'bytes');
              }
            } catch {
              setStats(null);
            }
            break;
          case 'token expiring':
            // Refresh token before expiry
            (async () => {
              try {
                const { token: newToken } = await getWebSocketToken();
                tokenRef.current = newToken;
                socketRef.current?.send(JSON.stringify({ event: 'auth', args: [newToken] }));
              } catch (e) {
                globalThis.console?.error('Failed to refresh token, reconnecting...', e);
                scheduleReconnect(1000);
              }
            })();
            break;
          case 'token expired':
            // Token already expired, reconnect
            scheduleReconnect(1000);
            break;
          case 'jwt error':
            globalThis.console?.error('JWT Error:', args?.[0]);
            // Attempt to reconnect with new token
            scheduleReconnect(1000);
            break;
          default:
            // Unknown/other events handled by onEvent/events; no-op here
            break;
        }
      };

      socket.onclose = (event) => {
        globalThis.console?.log('WebSocket disconnected:', event.code);
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        if (event.code !== 1000) {
          scheduleReconnect(5000);
        }
      };

      socket.onerror = (error) => {
        globalThis.console?.error('WebSocket error:', error);
      };

    } catch (error) {
      globalThis.console?.error('Failed to connect WebSocket:', error);
      scheduleReconnect(5000);
    }
  }, [getWebSocketToken]);

  const sendCommand = useCallback((command: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'send command',
        args: [command]
      }));
    }
  }, []);

  const setPowerState = useCallback((state: 'start' | 'stop' | 'restart' | 'kill') => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'set state',
        args: [state]
      }));
    }
  }, []);

  const requestLogs = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'send logs',
      }));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    
    return () => {
      mountedRef.current = false;
      cleanupReconnectTimeout();
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connect]);

  return {
    isConnected,
    console: logs,
    serverStatus,
    stats,
  events,
  lastEvent,
    sendCommand,
    setPowerState,
  requestLogs,
    reconnect: connect
  };
}