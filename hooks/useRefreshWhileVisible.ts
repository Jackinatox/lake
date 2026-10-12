import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Re-renders the current route's server components every `intervalMs` while the tab is visible,
 * and immediately when it becomes visible again. Client state survives `router.refresh()`.
 */
export function useRefreshWhileVisible(intervalMs: number) {
    const router = useRouter();

    useEffect(() => {
        const refreshIfVisible = () => {
            if (document.visibilityState === 'visible') router.refresh();
        };
        const interval = setInterval(refreshIfVisible, intervalMs);
        document.addEventListener('visibilitychange', refreshIfVisible);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', refreshIfVisible);
        };
    }, [router, intervalMs]);
}
