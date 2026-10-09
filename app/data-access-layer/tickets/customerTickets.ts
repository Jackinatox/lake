import 'server-only';

import prisma from '@/lib/prisma';

/**
 * Customer-facing ticket queries. None of these may ever touch `TicketNote` or select a staff
 * member's email: everything returned here ends up on the customer's screen. The caller is
 * responsible for passing the id of the signed-in user.
 */

const authorSelect = { username: true, displayUsername: true, name: true } as const;

export async function listCustomerTickets(userId: string) {
    return prisma.ticket.findMany({
        where: { userId },
        orderBy: { lastMessageAt: 'desc' },
        take: 100,
        select: {
            id: true,
            number: true,
            subject: true,
            category: true,
            status: true,
            createdAt: true,
            lastMessageAt: true,
            lastStaffMessageAt: true,
            gameServer: { select: { name: true } },
            readStates: { where: { userId }, select: { lastReadAt: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { body: true, authorRole: true },
            },
        },
    });
}
export type CustomerTicketListItem = Awaited<ReturnType<typeof listCustomerTickets>>[number];

export async function getCustomerTicket(userId: string, ticketId: string) {
    return prisma.ticket.findFirst({
        where: { id: ticketId, userId },
        select: {
            id: true,
            number: true,
            subject: true,
            category: true,
            status: true,
            createdAt: true,
            gameServer: {
                select: { name: true, ptServerId: true, gameData: { select: { name: true } } },
            },
            messages: {
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    body: true,
                    authorRole: true,
                    createdAt: true,
                    author: { select: authorSelect },
                },
            },
            // Only status changes are shown to the customer, and only some of them — see
            // `customerVisibleStatusEvent`.
            events: {
                where: { type: 'STATUS_CHANGED' },
                orderBy: { createdAt: 'asc' },
                select: {
                    id: true,
                    fromValue: true,
                    toValue: true,
                    actorId: true,
                    createdAt: true,
                },
            },
        },
    });
}
export type CustomerTicket = NonNullable<Awaited<ReturnType<typeof getCustomerTicket>>>;

export type CustomerStatusEventKind = 'resolved' | 'closed' | 'closedByYou' | 'reopened';

/**
 * Maps a status change to what the customer gets to see. Internal shuffling between OPEN,
 * WAITING_FOR_CUSTOMER and ON_HOLD stays hidden — the status badge already reflects it.
 */
export function customerVisibleStatusEvent(
    event: { fromValue: string | null; toValue: string | null; actorId: string | null },
    userId: string,
): CustomerStatusEventKind | null {
    if (event.toValue === 'RESOLVED') return 'resolved';
    if (event.toValue === 'CLOSED') return event.actorId === userId ? 'closedByYou' : 'closed';
    if (event.fromValue === 'RESOLVED' || event.fromValue === 'CLOSED') return 'reopened';
    return null;
}

export function isTicketUnreadForCustomer(ticket: {
    lastStaffMessageAt: Date | null;
    readStates: { lastReadAt: Date }[];
}) {
    if (!ticket.lastStaffMessageAt) return false;
    const lastReadAt = ticket.readStates[0]?.lastReadAt;
    return !lastReadAt || ticket.lastStaffMessageAt > lastReadAt;
}
