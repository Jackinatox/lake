import { useEffect, useRef, useState, useCallback } from 'react';

type ServerStatus = 'offline' | 'starting' | 'stopping' | 'running' | 'unknown';
type StatsPayload = {
  memory_bytes?: number;
  cpu_absolute?: number;
  disk_bytes?: number;
  [k: string]: unknown;
} | null;

export function useWebSocket(serverId: string, apiKey: string) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // Avoid shadowing the global console object
  const [logs, setLogs] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('unknown');
  const [stats, setStats] = useState<StatsPayload>(null);
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
        const message = JSON.parse(event.data);
        
        switch (message.event) {
          case 'console output':
            setLogs(prev => [...prev, String(message.args?.[0] ?? '')]);
            break;
          case 'status':
            setServerStatus((message.args?.[0] as ServerStatus) ?? 'unknown');
            break;
          case 'stats':
            try {
              setStats(JSON.parse(message.args?.[0] ?? '{}'));
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
            globalThis.console?.error('JWT Error:', message.args?.[0]);
            // Attempt to reconnect with new token
            scheduleReconnect(1000);
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
    sendCommand,
    setPowerState,
    reconnect: connect
  };
}