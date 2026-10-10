import 'server-only';

import type { Prisma } from '@/app/client/generated/client';
import type { TicketState } from '@/app/client/generated/enums';
import prisma from '@/lib/prisma';
import { activeSuspensionSubSelect } from '@/lib/gameserver/suspension';
import { ADMIN_TICKETS_PAGE_SIZE } from '@/lib/tickets/constants';
import type {
    AdminTicketFilters,
    AdminTicketSort,
    AdminTicketView,
} from '@/lib/validation/tickets';

/** Admin ticket queries. These do not check the session — callers must `requireAdmin()` first. */

const IN_PROGRESS_STATES: TicketState[] = ['OPEN', 'WAITING_FOR_CUSTOMER', 'ON_HOLD'];

function viewWhere(view: AdminTicketView, adminId: string): Prisma.TicketWhereInput {
    switch (view) {
        case 'needsReply':
            return { status: 'OPEN' };
        case 'mine':
            return { assigneeId: adminId, status: { in: IN_PROGRESS_STATES } };
        case 'unassigned':
            return { assigneeId: null, status: { in: IN_PROGRESS_STATES } };
        case 'waiting':
            return { status: 'WAITING_FOR_CUSTOMER' };
        case 'onHold':
            return { status: 'ON_HOLD' };
        case 'resolved':
            return { status: 'RESOLVED' };
        case 'closed':
            return { status: 'CLOSED' };
        case 'all':
            return {};
    }
}

function searchWhere(q: string): Prisma.TicketWhereInput {
    const contains = { contains: q, mode: 'insensitive' } as const;
    // Ticket numbers are Int4 — anything longer than 9 digits cannot match and would overflow.
    const numberMatch = q.match(/^#?(\d{1,9})$/);
    return {
        OR: [
            ...(numberMatch ? [{ number: Number(numberMatch[1]) }] : []),
            { subject: contains },
            { user: { is: { OR: [{ email: contains }, { username: contains }] } } },
            { messages: { some: { body: contains } } },
        ],
    };
}

export function defaultAdminTicketSort(view: AdminTicketView): AdminTicketSort {
    // The reply queue is worked oldest-first; every other view shows the latest activity first.
    return view === 'needsReply' ? 'waiting' : 'activity';
}

function orderBy(sort: AdminTicketSort): Prisma.TicketOrderByWithRelationInput[] {
    switch (sort) {
        case 'activity':
            return [{ lastMessageAt: 'desc' }];
        case 'waiting':
            return [
                { lastCustomerMessageAt: { sort: 'asc', nulls: 'last' } },
                { createdAt: 'asc' },
            ];
        case 'priority':
            // Postgres sorts enums by declaration order: LOW < NORMAL < HIGH < URGENT.
            return [{ priority: 'desc' }, { lastMessageAt: 'desc' }];
        case 'created':
            return [{ createdAt: 'desc' }];
    }
}

export async function listAdminTickets(filters: AdminTicketFilters, adminId: string) {
    const where: Prisma.TicketWhereInput = {
        AND: [
            viewWhere(filters.view, adminId),
            filters.category ? { category: filters.category } : {},
            filters.priority ? { priority: filters.priority } : {},
            filters.userId ? { userId: filters.userId } : {},
            filters.serverId ? { gameServerId: filters.serverId } : {},
            filters.q ? searchWhere(filters.q) : {},
        ],
    };
    const sort = filters.sort ?? defaultAdminTicketSort(filters.view);

    const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
            where,
            orderBy: orderBy(sort),
            skip: (filters.page - 1) * ADMIN_TICKETS_PAGE_SIZE,
            take: ADMIN_TICKETS_PAGE_SIZE,
            select: {
                id: true,
                number: true,
                subject: true,
                category: true,
                status: true,
                priority: true,
                createdAt: true,
                lastMessageAt: true,
                lastCustomerMessageAt: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        displayUsername: true,
                        name: true,
                    },
                },
                assignee: {
                    select: { id: true, username: true, displayUsername: true, name: true },
                },
                gameServer: { select: { id: true, name: true } },
                readStates: { where: { userId: adminId }, select: { lastReadAt: true } },
                _count: { select: { messages: true } },
            },
        }),
        prisma.ticket.count({ where }),
    ]);

    return { tickets, total, sort };
}
export type AdminTicketListItem = Awaited<ReturnType<typeof listAdminTickets>>['tickets'][number];

export function isTicketUnreadForAdmin(ticket: {
    lastCustomerMessageAt: Date | null;
    readStates: { lastReadAt: Date }[];
}) {
    if (!ticket.lastCustomerMessageAt) return false;
    const lastReadAt = ticket.readStates[0]?.lastReadAt;
    return !lastReadAt || ticket.lastCustomerMessageAt > lastReadAt;
}

/** Global counts per inbox view (ignoring the other filters), for the view tabs. */
export async function getAdminTicketViewCounts(
    adminId: string,
): Promise<Record<AdminTicketView, number>> {
    const views: AdminTicketView[] = [
        'needsReply',
        'mine',
        'unassigned',
        'waiting',
        'onHold',
        'resolved',
        'closed',
        'all',
    ];
    const counts = await Promise.all(
        views.map((view) => prisma.ticket.count({ where: viewWhere(view, adminId) })),
    );
    return Object.fromEntries(views.map((view, i) => [view, counts[i]])) as Record<
        AdminTicketView,
        number
    >;
}

/** Oldest unanswered ticket and the median time to first staff response over the last 30 days. */
export async function getAdminTicketStats() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [oldestWaiting, responded] = await Promise.all([
        prisma.ticket.findFirst({
            where: { status: 'OPEN' },
            orderBy: [{ lastCustomerMessageAt: { sort: 'asc', nulls: 'last' } }],
            select: { number: true, lastCustomerMessageAt: true, createdAt: true },
        }),
        prisma.ticket.findMany({
            where: { createdAt: { gte: since }, firstResponseAt: { not: null } },
            select: { createdAt: true, firstResponseAt: true },
            take: 2_000,
        }),
    ]);

    const durations = responded
        .map((t) => t.firstResponseAt!.getTime() - t.createdAt.getTime())
        .sort((a, b) => a - b);
    const medianFirstResponseMs =
        durations.length === 0
            ? null
            : durations.length % 2 === 1
              ? durations[(durations.length - 1) / 2]
              : (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2;

    return {
        oldestWaiting: oldestWaiting
            ? {
                  number: oldestWaiting.number,
                  since: oldestWaiting.lastCustomerMessageAt ?? oldestWaiting.createdAt,
              }
            : null,
        medianFirstResponseMs,
        respondedCount: durations.length,
    };
}

const adminUserSelect = {
    id: true,
    email: true,
    username: true,
    displayUsername: true,
    name: true,
    image: true,
} as const;

export async function getAdminTicket(ticketNumber: number) {
    return prisma.ticket.findUnique({
        where: { number: ticketNumber },
        include: {
            user: {
                select: {
                    ...adminUserSelect,
                    createdAt: true,
                    emailVerified: true,
                    banned: true,
                    banReason: true,
                },
            },
            assignee: { select: adminUserSelect },
            gameServer: {
                select: {
                    id: true,
                    name: true,
                    status: true,
                    type: true,
                    expires: true,
                    ptServerId: true,
                    gameData: { select: { name: true } },
                    location: { select: { name: true } },
                    suspensions: activeSuspensionSubSelect(),
                },
            },
            messages: {
                orderBy: { createdAt: 'asc' },
                include: { author: { select: adminUserSelect } },
            },
            notes: {
                orderBy: { createdAt: 'asc' },
                include: { author: { select: adminUserSelect } },
            },
            events: {
                orderBy: { createdAt: 'asc' },
                include: { actor: { select: adminUserSelect } },
            },
        },
    });
}
export type AdminTicketDetail = NonNullable<Awaited<ReturnType<typeof getAdminTicket>>>;

/** The customer's other tickets and servers, for the detail sidebar. */
export async function getTicketCustomerContext(userId: string, excludeTicketId: string) {
    const [otherTickets, otherTicketCount, servers] = await Promise.all([
        prisma.ticket.findMany({
            where: { userId, id: { not: excludeTicketId } },
            orderBy: { lastMessageAt: 'desc' },
            take: 5,
            select: { id: true, number: true, subject: true, status: true, lastMessageAt: true },
        }),
        prisma.ticket.count({ where: { userId, id: { not: excludeTicketId } } }),
        prisma.gameServer.findMany({
            where: { userId, status: { not: 'DELETED' } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                name: true,
                status: true,
                gameData: { select: { name: true } },
                suspensions: activeSuspensionSubSelect(),
            },
        }),
    ]);
    return { otherTickets, otherTicketCount, servers };
}
export type TicketCustomerContext = Awaited<ReturnType<typeof getTicketCustomerContext>>;

export async function listAdminUsers() {
    return prisma.user.findMany({
        where: { role: 'admin' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, username: true, displayUsername: true, name: true, email: true },
    });
}
export type AdminUserOption = Awaited<ReturnType<typeof listAdminUsers>>[number];
