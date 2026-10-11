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
import {
    TicketInboxToolbar,
    TicketInboxViews,
} from '@/components/admin/tickets/TicketInboxFilters';
import TicketStatusLabel from '@/components/support/TicketStatusLabel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';

type SearchParams = Record<string, string | string[] | undefined>;

// Shared by the column header and the rows; below xl the rows stack instead.
const INBOX_COLUMNS =
    'xl:grid-cols-[0.5rem_3.5rem_minmax(0,1fr)_6rem_4.5rem_8.5rem_6rem_4rem_4.5rem]';

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

            <div className="grid divide-y rounded-lg border bg-card shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <Stat label="Needs reply">
                    <span className="text-2xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                        {counts.needsReply}
                    </span>
                </Stat>
                <Stat label="Oldest unanswered">
                    {stats.oldestWaiting ? (
                        <Link
                            href={`/admin/support/${stats.oldestWaiting.number}`}
                            className="flex items-baseline gap-2 hover:underline"
                        >
                            <span
                                className={cn(
                                    'text-2xl tabular-nums',
                                    waitingClass(stats.oldestWaiting.since, now),
                                )}
                            >
                                {formatTicketAge(stats.oldestWaiting.since, now)}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                                #{stats.oldestWaiting.number}
                            </span>
                        </Link>
                    ) : (
                        <span className="text-2xl font-semibold text-muted-foreground">—</span>
                    )}
                </Stat>
                <Stat label="Median first response (30d)">
                    <span className="text-2xl font-semibold tabular-nums">
                        {stats.medianFirstResponseMs === null
                            ? '—'
                            : formatMilliseconds(stats.medianFirstResponseMs)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {stats.respondedCount} tickets
                    </span>
                </Stat>
            </div>

            <div className="grid gap-4 lg:grid-cols-[12.5rem_minmax(0,1fr)]">
                <aside>
                    <div className="lg:sticky lg:top-20">
                        <TicketInboxViews view={filters.view} counts={counts} />
                    </div>
                </aside>

                <Card className="min-w-0 overflow-hidden">
                    <TicketInboxToolbar
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
                    <div
                        className={cn(
                            'hidden items-center gap-3 border-b bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground xl:grid',
                            INBOX_COLUMNS,
                        )}
                    >
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
                                            className={cn(
                                                'flex flex-col gap-1.5 px-4 py-2.5 text-sm transition-colors hover:bg-accent/50 xl:grid xl:items-center xl:gap-3',
                                                INBOX_COLUMNS,
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'hidden h-2 w-2 rounded-full xl:block',
                                                    unread ? 'bg-primary' : 'bg-transparent',
                                                )}
                                            />
                                            <span className="hidden font-mono text-xs text-muted-foreground xl:block">
                                                #{ticket.number}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {unread && (
                                                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary xl:hidden" />
                                                    )}
                                                    <span className="font-mono text-xs text-muted-foreground xl:hidden">
                                                        #{ticket.number}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'truncate',
                                                            unread
                                                                ? 'font-semibold'
                                                                : 'font-medium',
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
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs xl:contents">
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
                                                        ? (staffDisplayName(ticket.assignee) ??
                                                          'Admin')
                                                        : '—'}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-xs xl:text-right',
                                                        waitingSince
                                                            ? waitingClass(waitingSince, now)
                                                            : 'text-muted-foreground',
                                                    )}
                                                >
                                                    {waitingSince
                                                        ? formatTicketAge(waitingSince, now)
                                                        : '—'}
                                                </span>
                                                <span className="text-xs text-muted-foreground xl:text-right">
                                                    {formatTicketAge(ticket.lastMessageAt, now)} ago
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <div className="flex items-center justify-between gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                            {firstRow}–{lastRow} of {total}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="mr-1 tabular-nums">
                                Page {filters.page} of {pageCount}
                            </span>
                            <PageButton
                                href={filters.page > 1 ? pageHref(filters.page - 1) : undefined}
                                label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </PageButton>
                            <PageButton
                                href={
                                    filters.page < pageCount
                                        ? pageHref(filters.page + 1)
                                        : undefined
                                }
                                label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </PageButton>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <div className="flex items-baseline gap-2">{children}</div>
        </div>
    );
}

function PageButton({
    href,
    label,
    children,
}: {
    href?: string;
    label: string;
    children: React.ReactNode;
}) {
    if (!href) {
        return (
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled aria-label={label}>
                {children}
            </Button>
        );
    }
    return (
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
            <Link href={href} aria-label={label}>
                {children}
            </Link>
        </Button>
    );
}
