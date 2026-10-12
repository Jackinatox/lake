'use client';

import { markTicketReadAction } from '@/app/actions/tickets/customerTicketActions';
import { useRefreshWhileVisible } from '@/hooks/useRefreshWhileVisible';
import { TICKET_REFRESH_INTERVAL_MS } from '@/lib/tickets/constants';
import { useEffect, useRef } from 'react';

/** Room kept below the newest message for the sticky reply composer. */
const COMPOSER_CLEARANCE_PX = 160;

/**
 * Keeps an open ticket page live without websockets (see `useRefreshWhileVisible`). Whenever a
 * new message shows up it marks the ticket as read and scrolls to it. Place it right after the
 * timeline list.
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
        const anchor = anchorRef.current;
        if (anchor) {
            // Measure the newest entry, not this anchor: the customer timeline stretches to fill
            // the screen, so the anchor always sits at the bottom. Scroll just far enough to show
            // the entry above the sticky composer; a short conversation stays at the very top.
            const newest = anchor.previousElementSibling?.lastElementChild ?? anchor;
            const bottom = newest.getBoundingClientRect().bottom + window.scrollY;
            window.scrollTo({
                top: Math.max(0, bottom + COMPOSER_CLEARANCE_PX - window.innerHeight),
            });
        }
        markTicketReadAction({ ticketId }).catch(() => {});
    }, [ticketId, latestMessageId]);

    return <div ref={anchorRef} aria-hidden />;
}
