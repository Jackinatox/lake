import {
    getAdminTicket,
    getTicketCustomerContext,
    listAdminUsers,
    type AdminTicketDetail,
} from '@/app/data-access-layer/tickets/adminTickets';
import { auth } from '@/auth';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminTicketComposer from '@/components/admin/tickets/AdminTicketComposer';
import CopyTextButton from '@/components/admin/tickets/CopyTextButton';
import TicketNoteItem from '@/components/admin/tickets/TicketNoteItem';
import TicketPropertiesPanel from '@/components/admin/tickets/TicketPropertiesPanel';
import LinkifiedText from '@/components/support/LinkifiedText';
import TicketAutoRefresh from '@/components/support/TicketAutoRefresh';
import TicketBadge from '@/components/support/TicketBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserDisplayName, getUserInitials } from '@/lib/auth/getUserDisplayName';
import { getActiveSuspension, isSuspensionProcessing } from '@/lib/gameserver/suspension';
import {
    adminTicketCategoryLabels,
    adminTicketEventLabels,
    adminTicketPriorityLabels,
    adminTicketStateLabels,
    formatTicketDateTime,
    formatTicketEventValue,
    formatTicketTime,
    staffDisplayName,
    ticketCategoryStyles,
    ticketPriorityStyles,
    ticketStateStyles,
} from '@/lib/tickets/presentation';
import { ticketDayLabel, withDaySeparators } from '@/lib/tickets/timeline';
import { cn } from '@/lib/utils';
import { ExternalLink, Pin, ShieldCheck } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type TimelineEntry =
    | { kind: 'message'; createdAt: Date; message: AdminTicketDetail['messages'][number] }
    | { kind: 'note'; createdAt: Date; note: AdminTicketDetail['notes'][number] }
    | { kind: 'event'; createdAt: Date; event: AdminTicketDetail['events'][number] };

function adminName(user: Parameters<typeof getUserDisplayName>[0]) {
    return staffDisplayName(user) ?? getUserDisplayName(user);
}

export default async function AdminTicketPage({
    params,
}: {
    params: Promise<{ locale: string; number: string }>;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const { locale, number } = await params;
    const ticketNumber = Number(number);
    if (!Number.isInteger(ticketNumber) || ticketNumber < 1 || ticketNumber > 2_147_483_647) {
        notFound();
    }

    const ticket = await getAdminTicket(ticketNumber);
    if (!ticket) notFound();

    const [context, admins] = await Promise.all([
        ticket.userId ? getTicketCustomerContext(ticket.userId, ticket.id) : null,
        listAdminUsers(),
    ]);

    const entries: TimelineEntry[] = [
        ...ticket.messages.map((message) => ({
            kind: 'message' as const,
            createdAt: message.createdAt,
            message,
        })),
        ...ticket.notes.map((note) => ({ kind: 'note' as const, createdAt: note.createdAt, note })),
        // The CREATED event is implied by the first message.
        ...ticket.events
            .filter((event) => event.type !== 'CREATED')
            .map((event) => ({ kind: 'event' as const, createdAt: event.createdAt, event })),
    ];
    const timeline = withDaySeparators(entries);
    const latestMessageId = ticket.messages.at(-1)?.id ?? 0;
    const pinnedNotes = ticket.notes.filter((note) => note.pinned);
    const customer = ticket.user;
    const server = ticket.gameServer;
    const suspension = server ? getActiveSuspension(server) : null;

    return (
        <div className="flex w-full flex-col gap-4">
            <AdminBreadcrumb
                items={[
                    { label: 'Support Inbox', href: '/admin/support' },
                    { label: `#${ticket.number}` },
                ]}
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="flex min-w-0 flex-col gap-4">
                    <header className="space-y-2">
                        <h1 className="break-words text-xl font-semibold tracking-tight md:text-2xl">
                            <span className="mr-2 font-mono text-muted-foreground">
                                #{ticket.number}
                            </span>
                            {ticket.subject}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <TicketBadge className={ticketStateStyles[ticket.status]}>
                                {adminTicketStateLabels[ticket.status]}
                            </TicketBadge>
                            <TicketBadge className={ticketPriorityStyles[ticket.priority]}>
                                {adminTicketPriorityLabels[ticket.priority]}
                            </TicketBadge>
                            <TicketBadge className={ticketCategoryStyles[ticket.category]}>
                                {adminTicketCategoryLabels[ticket.category]}
                            </TicketBadge>
                            <span>Opened {formatTicketDateTime(ticket.createdAt, locale)}</span>
                            {ticket.assignee && (
                                <span>· Assigned to {adminName(ticket.assignee)}</span>
                            )}
                        </div>
                    </header>

                    <ol className="flex flex-col gap-3">
                        {timeline.map((row) => {
                            if (row.type === 'day') {
                                return (
                                    <li key={`day-${row.key}`} className="flex justify-center py-1">
                                        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                            {ticketDayLabel(row.date, locale, {
                                                today: 'Today',
                                                yesterday: 'Yesterday',
                                            })}
                                        </span>
                                    </li>
                                );
                            }

                            const entry = row.item;
                            const time = formatTicketTime(entry.createdAt, locale);

                            if (entry.kind === 'event') {
                                const { event } = entry;
                                const actor = event.actor ? adminName(event.actor) : 'System';
                                return (
                                    <li
                                        key={`event-${event.id}`}
                                        className="text-center text-xs text-muted-foreground"
                                    >
                                        <span className="font-medium text-foreground/80">
                                            {actor}
                                        </span>{' '}
                                        {adminTicketEventLabels[event.type]}
                                        {(event.fromValue || event.toValue) && (
                                            <>
                                                {': '}
                                                {formatTicketEventValue(
                                                    event.type,
                                                    event.fromValue,
                                                )}{' '}
                                                →{' '}
                                                {formatTicketEventValue(event.type, event.toValue)}
                                            </>
                                        )}{' '}
                                        · {time}
                                    </li>
                                );
                            }

                            if (entry.kind === 'note') {
                                const { note } = entry;
                                return (
                                    <li key={`note-${note.id}`}>
                                        <TicketNoteItem
                                            note={{
                                                id: note.id,
                                                body: note.body,
                                                pinned: note.pinned,
                                                authorName: note.author
                                                    ? adminName(note.author)
                                                    : 'Deleted admin',
                                                isOwn: note.authorId === session.user.id,
                                                timeLabel: time,
                                                edited:
                                                    note.updatedAt.getTime() -
                                                        note.createdAt.getTime() >
                                                    1_000,
                                            }}
                                        />
                                    </li>
                                );
                            }

                            const { message } = entry;
                            const fromCustomer = message.authorRole === 'CUSTOMER';
                            const name =
                                message.authorRole === 'SYSTEM'
                                    ? 'System'
                                    : message.author
                                      ? fromCustomer
                                          ? getUserDisplayName(message.author)
                                          : adminName(message.author)
                                      : fromCustomer
                                        ? 'Deleted user'
                                        : 'Deleted admin';
                            return (
                                <li
                                    key={`message-${message.id}`}
                                    className={cn(
                                        'flex gap-2',
                                        fromCustomer ? 'justify-start' : 'justify-end',
                                    )}
                                >
                                    {fromCustomer && (
                                        <div className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                            {getUserInitials({ username: name })}
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            'flex max-w-[85%] flex-col gap-1',
                                            fromCustomer ? 'items-start' : 'items-end',
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">
                                                {name}
                                            </span>
                                            {message.authorRole === 'STAFF' && (
                                                <ShieldCheck className="h-3 w-3 text-primary" />
                                            )}
                                            <span>{time}</span>
                                        </div>
                                        <div
                                            className={cn(
                                                'whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                                fromCustomer
                                                    ? 'rounded-bl-sm border bg-card'
                                                    : 'rounded-br-sm bg-primary text-primary-foreground',
                                            )}
                                        >
                                            <LinkifiedText text={message.body} />
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                    <TicketAutoRefresh ticketId={ticket.id} latestMessageId={latestMessageId} />

                    <AdminTicketComposer
                        ticketId={ticket.id}
                        currentStatus={ticket.status}
                        latestMessageId={latestMessageId}
                        hasCustomer={Boolean(customer)}
                    />
                </div>

                <aside className="flex flex-col gap-4">
                    {pinnedNotes.length > 0 && (
                        <Card className="border-amber-500/40">
                            <CardHeader className="pb-2 md:pb-3">
                                <CardTitle className="flex items-center gap-1.5 text-base">
                                    <Pin className="h-4 w-4 text-amber-600" />
                                    Pinned notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {pinnedNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="rounded-md bg-amber-50/70 p-2 text-sm dark:bg-amber-950/20"
                                    >
                                        <p className="line-clamp-6 whitespace-pre-wrap break-words">
                                            {note.body}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {note.author ? adminName(note.author) : 'Deleted admin'}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <TicketPropertiesPanel
                        ticketId={ticket.id}
                        ticketNumber={ticket.number}
                        subject={ticket.subject}
                        status={ticket.status}
                        priority={ticket.priority}
                        category={ticket.category}
                        assigneeId={ticket.assigneeId}
                        gameServerId={ticket.gameServerId}
                        currentAdminId={session.user.id}
                        admins={admins.map((admin) => ({ id: admin.id, label: adminName(admin) }))}
                        servers={(context?.servers ?? []).map((s) => ({
                            id: s.id,
                            label: `${s.name} · ${s.gameData.name}${getActiveSuspension(s) ? ' (suspended)' : ''}`,
                        }))}
                    />

                    <Card>
                        <CardHeader className="pb-2 md:pb-3">
                            <CardTitle className="text-base">Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {customer ? (
                                <>
                                    <div>
                                        <div className="font-medium">
                                            {getUserDisplayName(customer)}
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <span className="truncate">{customer.email}</span>
                                            <CopyTextButton text={customer.email} label="Email" />
                                        </div>
                                    </div>
                                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                                        <dt className="text-muted-foreground">Joined</dt>
                                        <dd>{formatTicketDateTime(customer.createdAt, locale)}</dd>
                                        <dt className="text-muted-foreground">Email verified</dt>
                                        <dd>{customer.emailVerified ? 'Yes' : 'No'}</dd>
                                        {customer.banned && (
                                            <>
                                                <dt className="text-muted-foreground">Banned</dt>
                                                <dd className="font-medium text-destructive">
                                                    {customer.banReason || 'Yes'}
                                                </dd>
                                            </>
                                        )}
                                    </dl>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                        <Link
                                            href={`/admin/support?view=all&userId=${customer.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            All tickets
                                        </Link>
                                        <Link
                                            href={`/admin/gameservers?userId=${customer.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            Gameservers ({context?.servers.length ?? 0})
                                        </Link>
                                        <Link
                                            href={`/admin/logs?userId=${customer.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            Logs
                                        </Link>
                                    </div>
                                    {context && context.otherTickets.length > 0 && (
                                        <div className="space-y-1 border-t pt-3">
                                            <div className="text-xs font-medium text-muted-foreground">
                                                Other tickets ({context.otherTicketCount})
                                            </div>
                                            <ul className="space-y-1">
                                                {context.otherTickets.map((other) => (
                                                    <li key={other.id}>
                                                        <Link
                                                            href={`/admin/support/${other.number}`}
                                                            className="flex items-center gap-2 text-xs hover:underline"
                                                        >
                                                            <span className="font-mono text-muted-foreground">
                                                                #{other.number}
                                                            </span>
                                                            <span className="min-w-0 flex-1 truncate">
                                                                {other.subject}
                                                            </span>
                                                            <TicketBadge
                                                                className={
                                                                    ticketStateStyles[other.status]
                                                                }
                                                            >
                                                                {
                                                                    adminTicketStateLabels[
                                                                        other.status
                                                                    ]
                                                                }
                                                            </TicketBadge>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground">
                                    The customer account was deleted.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {server && (
                        <Card>
                            <CardHeader className="pb-2 md:pb-3">
                                <CardTitle className="text-base">Linked server</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <div className="font-medium">{server.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {server.gameData.name} · {server.location.name} ·{' '}
                                        {server.type}
                                    </div>
                                </div>
                                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                                    <dt className="text-muted-foreground">Status</dt>
                                    <dd>{server.status}</dd>
                                    <dt className="text-muted-foreground">Expires</dt>
                                    <dd>{formatTicketDateTime(server.expires, locale)}</dd>
                                    {server.ptServerId && (
                                        <>
                                            <dt className="text-muted-foreground">PT id</dt>
                                            <dd className="font-mono">{server.ptServerId}</dd>
                                        </>
                                    )}
                                </dl>
                                {suspension && (
                                    <div className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs">
                                        <div className="font-semibold text-red-600 dark:text-red-400">
                                            Suspended
                                            {isSuspensionProcessing(suspension)
                                                ? ' · processing'
                                                : ` until ${formatTicketDateTime(suspension.expiresAt, locale)}`}
                                            {suspension.deleteAfterExpiry && ' · then deleted'}
                                        </div>
                                        <p className="mt-1 whitespace-pre-wrap break-words">
                                            {suspension.reason}
                                        </p>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                    <Link
                                        href={`/admin/gameservers?serverId=${server.id}`}
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                        Gameserver admin
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                    <Link
                                        href={`/admin/logs?serverId=${server.id}`}
                                        className="text-primary hover:underline"
                                    >
                                        Logs
                                    </Link>
                                    <Link
                                        href={`/admin/support?view=all&serverId=${server.id}`}
                                        className="text-primary hover:underline"
                                    >
                                        Tickets for this server
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </aside>
            </div>
        </div>
    );
}
