// Small event hub for server state notifications (install/restore)
type Listener = (payload?: any) => void;

const listeners: Record<string, Listener[]> = {};

export function on(event: string, cb: Listener) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return () => {
        listeners[event] = listeners[event].filter(l => l !== cb);
    };
}

export function emit(event: string, payload?: any) {
    (listeners[event] || []).slice().forEach(cb => cb(payload));
}

// Convenience helpers
export const notifyRestoreStarted = (serverId: string) => emit('restore_started', { serverId });
export const notifyRestoreStopped = (serverId: string) => emit('restore_stopped', { serverId });
export const notifyReinstallStarted = (serverId: string) => emit('reinstall_started', { serverId });
export const notifyReinstallStopped = (serverId: string) => emit('reinstall_stopped', { serverId });
