'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Soft-refreshes the server components of the current route on an interval
 * (no full page reload, client state is kept), so server-rendered data like
 * expiry or suspension stays current.
 */
export default function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') router.refresh();
        }, intervalMs);
        return () => clearInterval(interval);
    }, [router, intervalMs]);

    return null;
}
