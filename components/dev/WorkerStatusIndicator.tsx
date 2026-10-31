'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 15_000;

type Status = 'checking' | 'online' | 'offline';

/**
 * Dev only: a dot in the navbar's top right corner showing whether the provisioning worker
 * answers (/api/dev/worker-status). Absolutely positioned, so it never moves navbar items.
 * Label only from md up, phones get the dot.
 */
export default function WorkerStatusIndicator() {
    const [status, setStatus] = useState<Status>('checking');

    useEffect(() => {
        let cancelled = false;
        const check = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const response = await fetch('/api/dev/worker-status', { cache: 'no-store' });
                const data = (await response.json()) as { online?: boolean };
                if (!cancelled) setStatus(data.online ? 'online' : 'offline');
            } catch {
                if (!cancelled) setStatus('offline');
            }
        };
        check();
        const interval = setInterval(check, POLL_INTERVAL_MS);
        document.addEventListener('visibilitychange', check);
        return () => {
            cancelled = true;
            clearInterval(interval);
            document.removeEventListener('visibilitychange', check);
        };
    }, []);

    const label = { checking: 'Worker …', online: 'Worker online', offline: 'Worker offline' }[
        status
    ];

    return (
        <div
            className="absolute right-1 top-0.5 flex items-center gap-1 text-[10px] font-medium leading-none text-yellow-950"
            title={label}
            aria-label={label}
            role="status"
        >
            <span
                className={cn(
                    'h-2 w-2 rounded-full ring-1 ring-yellow-950/30',
                    status === 'online' && 'bg-green-600',
                    status === 'offline' && 'bg-red-600',
                    status === 'checking' && 'bg-zinc-400',
                )}
            />
            <span className="hidden md:inline">{label}</span>
        </div>
    );
}
