import {
    customerVisibleStatusEvent,
    getCustomerTicket,
    type CustomerStatusEventKind,
} from '@/app/data-access-layer/tickets/customerTickets';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import LinkifiedText from '@/components/support/LinkifiedText';
import TicketAutoRefresh from '@/components/support/TicketAutoRefresh';
import TicketBadge from '@/components/support/TicketBadge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getUserInitials } from '@/lib/auth/getUserDisplayName';
import {
    formatTicketDateTime,
    formatTicketTime,
    staffDisplayName,
    ticketStateStyles,
} from '@/lib/tickets/presentation';
import { ticketDayLabel, withDaySeparators } from '@/lib/tickets/timeline';
import { cn } from '@/lib/utils';
import { ArrowLeft, Server, ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import CloseTicketButton from './CloseTicketButton';
import CustomerReplyComposer from './CustomerReplyComposer';

type TimelineEntry =
    | {
          kind: 'message';
          id: number;
          createdAt: Date;
          body: string;
          authorRole: 'CUSTOMER' | 'STAFF' | 'SYSTEM';
          authorName: string | null;
      }
    | { kind: 'event'; id: number; createdAt: Date; event: CustomerStatusEventKind };

export default async function CustomerTicketPage({
    params,
}: {
    params: Promise<{ locale: string; ticketId: string }>;
}) {
    const [{ locale, ticketId }, session] = await Promise.all([
        params,
        auth.api.getSession({ headers: await headers() }),
    ]);

    if (!session) {
        return <NotLoggedIn />;
    }

    const [t, ticket] = await Promise.all([
        getTranslations('supportTickets'),
        getCustomerTicket(session.user.id, ticketId),
    ]);
    if (!ticket) notFound();

    const entries: TimelineEntry[] = [
        ...ticket.messages.map((message) => ({
            kind: 'message' as const,
            id: message.id,
            createdAt: message.createdAt,
            body: message.body,
            authorRole: message.authorRole,
            authorName: staffDisplayName(message.author),
        })),
        ...ticket.events.flatMap((event) => {
            const kind = customerVisibleStatusEvent(event, session.user.id);
            return kind
                ? [
                      {
                          kind: 'event' as const,
                          id: event.id,
                          createdAt: event.createdAt,
                          event: kind,
                      },
                  ]
                : [];
        }),
    ];
    const timeline = withDaySeparators(entries);
    const latestMessageId = ticket.messages.at(-1)?.id ?? 0;
    const dayLabels = { today: t('detail.today'), yesterday: t('detail.yesterday') };

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col md:p-6">
            <Button asChild variant="ghost" size="sm" className="mb-2 gap-1 self-start px-2">
                <Link href="/support/tickets">
                    <ArrowLeft className="h-4 w-4" />
                    {t('detail.back')}
                </Link>
            </Button>

            <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                    <h1 className="break-words text-xl font-semibold tracking-tight md:text-2xl">
                        {ticket.subject}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <TicketBadge className={ticketStateStyles[ticket.status]}>
                            {t(`status.${ticket.status}`)}
                        </TicketBadge>
                        <span>#{ticket.number}</span>
                        <span>·</span>
                        <span>{t(`categories.${ticket.category}.title`)}</span>
                        {ticket.gameServer && (
                            <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                    <Server className="h-3 w-3" />
                                    {ticket.gameServer.name}
                                </span>
                            </>
                        )}
                        <span>·</span>
                        <span>
                            {t('detail.openedAt', {
                                date: formatTicketDateTime(ticket.createdAt, locale),
                            })}
                        </span>
                    </div>
                </div>
                {ticket.status !== 'CLOSED' && <CloseTicketButton ticketId={ticket.id} />}
            </header>

            <ol className="flex flex-col gap-3 py-6">
                {timeline.map((row) => {
                    if (row.type === 'day') {
                        return (
                            <li key={`day-${row.key}`} className="flex justify-center py-1">
                                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                    {ticketDayLabel(row.date, locale, dayLabels)}
                                </span>
                            </li>
                        );
                    }

                    const entry = row.item;
                    if (entry.kind === 'event') {
                        return (
                            <li
                                key={`event-${entry.id}`}
                                className="flex justify-center text-center text-xs text-muted-foreground"
                            >
                                {t(`detail.events.${entry.event}`)} ·{' '}
                                {formatTicketTime(entry.createdAt, locale)}
                            </li>
                        );
                    }

                    const own = entry.authorRole === 'CUSTOMER';
                    const name = own
                        ? t('detail.you')
                        : entry.authorRole === 'SYSTEM'
                          ? t('detail.system')
                          : (entry.authorName ?? t('detail.supportTeam'));

                    return (
                        <li
                            key={`message-${entry.id}`}
                            className={cn('flex gap-2', own ? 'justify-end' : 'justify-start')}
                        >
                            {!own && (
                                <div className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                                    {getUserInitials({ username: name })}
                                </div>
                            )}
                            <div
                                className={cn(
                                    'flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]',
                                    own ? 'items-end' : 'items-start',
                                )}
                            >
                                <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">{name}</span>
                                    {entry.authorRole === 'STAFF' && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                            <ShieldCheck className="h-3 w-3" />
                                            {t('detail.adminBadge')}
                                        </span>
                                    )}
                                    <span>{formatTicketTime(entry.createdAt, locale)}</span>
                                </div>
                                <div
                                    className={cn(
                                        'whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                        own
                                            ? 'rounded-br-sm bg-primary text-primary-foreground'
                                            : 'rounded-bl-sm border bg-card',
                                    )}
                                >
                                    <LinkifiedText text={entry.body} />
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
            <TicketAutoRefresh ticketId={ticket.id} latestMessageId={latestMessageId} />

            {ticket.status === 'CLOSED' ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {t('detail.closedNotice')}
                    <Button asChild size="sm" variant="outline">
                        <Link
                            href={`/support/tickets/new?category=${ticket.category}${
                                ticket.gameServer?.ptServerId
                                    ? `&server=${ticket.gameServer.ptServerId}`
                                    : ''
                            }`}
                        >
                            {t('detail.newTicket')}
                        </Link>
                    </Button>
                </div>
            ) : (
                <CustomerReplyComposer
                    ticketId={ticket.id}
                    resolved={ticket.status === 'RESOLVED'}
                />
            )}
        </div>
    );
}
