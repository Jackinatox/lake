declare global {
    interface Window {
        __ENV?: Record<string, string | undefined>;
    }
}

export function env(key: string): string | undefined {
    if (typeof window === 'undefined') {
        return process.env[key];
    }
    return window.__ENV?.[key];
}
