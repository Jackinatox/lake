'use client';

import { useRefreshWhileVisible } from '@/hooks/useRefreshWhileVisible';

const INBOX_REFRESH_INTERVAL_MS = 60_000;

export default function InboxAutoRefresh() {
    useRefreshWhileVisible(INBOX_REFRESH_INTERVAL_MS);
    return null;
}
