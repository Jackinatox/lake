import type { LogLevel } from '@/app/client/generated/enums';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

/**
 * Writes a `SUPPORT_TICKET` application log for a ticket event.
 *
 * Every entry is bound to the ticket's **customer** (`userId`) and **linked server**
 * (`gameServerId`), so the admin log viewer's user and server filters show a customer's whole
 * ticket history. The acting user (customer or admin) goes into `details.actorId`/`actorRole`.
 * Message bodies are never logged, only their length.
 */
export async function logTicketEvent(
    level: Exclude<LogLevel, 'FATAL'>,
    message: string,
    context: {
        ticket?: { id: string; number: number } | null;
        customerId: string | null | undefined;
        gameServerId?: string | null;
        actorId: string;
        actorRole: 'CUSTOMER' | 'ADMIN';
        details?: Record<string, unknown>;
    },
) {
    const { ticket, customerId, gameServerId, actorId, actorRole, details } = context;
    const method = { TRACE: 'trace', INFO: 'info', WARN: 'warn', ERROR: 'error' } as const;

    await logger[method[level]](
        ticket ? `Ticket #${ticket.number}: ${message}` : message,
        'SUPPORT_TICKET',
        {
            ...logger.extractHeadersContext(await headers()),
            userId: customerId ?? undefined,
            gameServerId: gameServerId ?? undefined,
            details: {
                ...(ticket && { ticketId: ticket.id, ticketNumber: ticket.number }),
                actorId,
                actorRole,
                ...details,
            },
        },
    );
}
