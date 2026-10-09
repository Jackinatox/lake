'use client';

import { markTicketReadAction } from '@/app/actions/tickets/customerTicketActions';
import { useRefreshWhileVisible } from '@/hooks/useRefreshWhileVisible';
import { TICKET_REFRESH_INTERVAL_MS } from '@/lib/tickets/constants';
import { useEffect, useRef } from 'react';

/**
 * Keeps an open ticket page live without websockets (see `useRefreshWhileVisible`). Whenever a
 * new message shows up it marks the ticket as read and scrolls to it. Place it right after the
 * last timeline entry.
 */
export default function TicketAutoRefresh({
    ticketId,
    latestMessageId,
}: {
    ticketId: string;
    latestMessageId: number;
}) {
    const anchorRef = useRef<HTMLDivElement>(null);
    useRefreshWhileVisible(TICKET_REFRESH_INTERVAL_MS);

    useEffect(() => {
        anchorRef.current?.scrollIntoView({ block: 'end' });
        markTicketReadAction({ ticketId }).catch(() => {});
    }, [ticketId, latestMessageId]);

    return <div ref={anchorRef} aria-hidden className="scroll-mb-40" />;
}
