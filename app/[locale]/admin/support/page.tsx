import {
    getAdminTicketStats,
    getAdminTicketViewCounts,
    isTicketUnreadForAdmin,
    listAdminTickets,
} from '@/app/data-access-layer/tickets/adminTickets';
import { auth } from '@/auth';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import NoAdmin from '@/components/admin/NoAdminMessage';
import InboxAutoRefresh from '@/components/admin/tickets/InboxAutoRefresh';
import TicketInboxFilters from '@/components/admin/tickets/TicketInboxFilters';
import TicketStatusLabel from '@/components/support/TicketStatusLabel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserDisplayName } from '@/lib/auth/getUserDisplayName';
import prisma from '@/lib/prisma';
import { formatMilliseconds } from '@/lib/formatTime';
import { ADMIN_TICKETS_PAGE_SIZE } from '@/lib/tickets/constants';
import {
    adminTicketCategoryLabels,
    adminTicketPriorityLabels,
    adminTicketStateLabels,
    formatTicketAge,
    staffDisplayName,
    ticketPriorityTextStyles,
} from '@/lib/tickets/presentation';
import { cn } from '@/lib/utils';
import { adminTicketFiltersSchema } from '@/lib/validation/tickets';
import { headers } from 'next/headers';
import Link from 'next/link';

type SearchParams = Record<string, string | string[] | undefined>;

function waitingClass(since: Date, now: Date) {
    const hours = (now.getTime() - since.getTime()) / 3_600_000;
    if (hours >= 48) return 'text-red-600 dark:text-red-400 font-semibold';
    if (hours >= 24) return 'text-amber-600 dark:text-amber-400 font-medium';
    return 'text-muted-foreground';
}

export default async function AdminSupportInboxPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const rawParams = await searchParams;
    const filters = adminTicketFiltersSchema.parse(
        Object.fromEntries(
            Object.entries(rawParams).map(([key, value]) => [
                key,
                Array.isArray(value) ? value[0] : value,
            ]),
        ),
    );

    const [{ tickets, total, sort }, counts, stats, filterUser, filterServer] = await Promise.all([
        listAdminTickets(filters, session.user.id),
        getAdminTicketViewCounts(session.user.id),
        getAdminTicketStats(),
        filters.userId
            ? prisma.user.findUnique({
                  where: { id: filters.userId },
                  select: { email: true, username: true, displayUsername: true, name: true },
              })
            : null,
        filters.serverId
            ? prisma.gameServer.findUnique({
                  where: { id: filters.serverId },
                  select: { name: true },
              })
            : null,
    ]);

    const now = new Date();
    const pageCount = Math.max(1, Math.ceil(total / ADMIN_TICKETS_PAGE_SIZE));
    const firstRow = total === 0 ? 0 : (filters.page - 1) * ADMIN_TICKETS_PAGE_SIZE + 1;
    const lastRow = Math.min(total, filters.page * ADMIN_TICKETS_PAGE_SIZE);
    const pageHref = (page: number) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(rawParams)) {
            const first = Array.isArray(value) ? value[0] : value;
            if (first && key !== 'page') params.set(key, first);
        }
        if (page > 1) params.set('page', String(page));
        const query = params.toString();
        return query ? `/admin/support?${query}` : '/admin/support';
    };

    return (
        <div className="flex min-h-[calc(100dvh-4rem)] w-full flex-col gap-4 pb-24 md:pb-32">
            <AdminBreadcrumb items={[{ label: 'Support Inbox' }]} />
            <InboxAutoRefresh />

            <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-1 md:pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Needs reply
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                            {counts.needsReply}
                        </span>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1 md:pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Oldest unanswered
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.oldestWaiting ? (
                            <Link
                                href={`/admin/support/${stats.oldestWaiting.number}`}
                                className="flex items-baseline gap-2 hover:underline"
                            >
                                <span
                                    className={cn(
                                        'text-2xl',
                                        waitingClass(stats.oldestWaiting.since, now),
                                    )}
                                >
                                    {formatTicketAge(stats.oldestWaiting.since, now)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    #{stats.oldestWaiting.number}
                                </span>
                            </Link>
                        ) : (
                            <span className="text-2xl font-semibold text-muted-foreground">—</span>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-1 md:pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Median first response (30d)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">
                            {stats.medianFirstResponseMs === null
                                ? '—'
                                : formatMilliseconds(stats.medianFirstResponseMs)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {stats.respondedCount} tickets
                        </span>
                    </CardContent>
                </Card>
            </div>

            <TicketInboxFilters
                view={filters.view}
                counts={counts}
                category={filters.category}
                priority={filters.priority}
                sort={sort}
                q={filters.q}
                userLabel={
                    filters.userId
                        ? filterUser
                            ? `${getUserDisplayName(filterUser)} (${filterUser.email})`
                            : filters.userId
                        : undefined
                }
                serverLabel={
                    filters.serverId ? (filterServer?.name ?? filters.serverId) : undefined
                }
            />

            <Card className="overflow-hidden">
                <div className="hidden grid-cols-[1.25rem_4rem_minmax(0,1fr)_7rem_5.5rem_9.5rem_7rem_4.5rem_4.5rem] items-center gap-3 border-b bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid">
                    <span />
                    <span>#</span>
                    <span>Subject / customer</span>
                    <span>Category</span>
                    <span>Priority</span>
                    <span>Status</span>
                    <span>Assignee</span>
                    <span className="text-right">Waiting</span>
                    <span className="text-right">Activity</span>
                </div>
                {tickets.length === 0 ? (
                    <p className="p-10 text-center text-sm text-muted-foreground">
                        No tickets match these filters.
                    </p>
                ) : (
                    <ul className="divide-y">
                        {tickets.map((ticket) => {
                            const unread = isTicketUnreadForAdmin(ticket);
                            const waitingSince =
                                ticket.status === 'OPEN'
                                    ? (ticket.lastCustomerMessageAt ?? ticket.createdAt)
                                    : null;
                            return (
                                <li key={ticket.id}>
                                    <Link
                                        href={`/admin/support/${ticket.number}`}
                                        className="flex flex-col gap-1.5 px-3 py-2.5 text-sm transition-colors hover:bg-accent/50 lg:grid lg:grid-cols-[1.25rem_4rem_minmax(0,1fr)_7rem_5.5rem_9.5rem_7rem_4.5rem_4.5rem] lg:items-center lg:gap-3"
                                    >
                                        <span
                                            className={cn(
                                                'hidden h-2 w-2 rounded-full lg:block',
                                                unread ? 'bg-primary' : 'bg-transparent',
                                            )}
                                        />
                                        <span className="hidden font-mono text-xs text-muted-foreground lg:block">
                                            #{ticket.number}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                {unread && (
                                                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary lg:hidden" />
                                                )}
                                                <span className="font-mono text-xs text-muted-foreground lg:hidden">
                                                    #{ticket.number}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'truncate',
                                                        unread ? 'font-semibold' : 'font-medium',
                                                    )}
                                                >
                                                    {ticket.subject}
                                                </span>
                                            </div>
                                            <div className="truncate text-xs text-muted-foreground">
                                                {ticket.user
                                                    ? `${getUserDisplayName(ticket.user)} · ${ticket.user.email}`
                                                    : 'Deleted user'}
                                                {ticket.gameServer &&
                                                    ` · ${ticket.gameServer.name}`}
                                                {` · ${ticket._count.messages} msg`}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs lg:contents">
                                            <span className="truncate text-muted-foreground">
                                                {adminTicketCategoryLabels[ticket.category]}
                                            </span>
                                            <span
                                                className={cn(
                                                    'truncate',
                                                    ticketPriorityTextStyles[ticket.priority],
                                                )}
                                            >
                                                {adminTicketPriorityLabels[ticket.priority]}
                                            </span>
                                            <TicketStatusLabel
                                                status={ticket.status}
                                                label={adminTicketStateLabels[ticket.status]}
                                            />
                                            <span className="truncate text-xs text-muted-foreground">
                                                {ticket.assignee
                                                    ? (staffDisplayName(ticket.assignee) ?? 'Admin')
                                                    : '—'}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-xs lg:text-right',
                                                    waitingSince
                                                        ? waitingClass(waitingSince, now)
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {waitingSince
                                                    ? formatTicketAge(waitingSince, now)
                                                    : '—'}
                                            </span>
                                            <span className="text-xs text-muted-foreground lg:text-right">
                                                {formatTicketAge(ticket.lastMessageAt, now)} ago
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    {firstRow}–{lastRow} of {total}
                </span>
                <div className="flex gap-2">
                    {filters.page > 1 ? (
                        <Button asChild variant="outline" size="sm">
                            <Link href={pageHref(filters.page - 1)}>Previous</Link>
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" disabled>
                            Previous
                        </Button>
                    )}
                    {filters.page < pageCount ? (
                        <Button asChild variant="outline" size="sm">
                            <Link href={pageHref(filters.page + 1)}>Next</Link>
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" disabled>
                            Next
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
