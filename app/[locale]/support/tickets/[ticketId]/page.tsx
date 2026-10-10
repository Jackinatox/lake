import {
    customerVisibleStatusEvent,
    getCustomerTicket,
    type CustomerStatusEventKind,
} from '@/app/data-access-layer/tickets/customerTickets';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import LinkifiedText from '@/components/support/LinkifiedText';
import TicketAutoRefresh from '@/components/support/TicketAutoRefresh';
import TicketAvatar from '@/components/support/TicketAvatar';
import TicketStatusLabel from '@/components/support/TicketStatusLabel';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getUserDisplayName } from '@/lib/auth/getUserDisplayName';
import {
    formatTicketDateTime,
    formatTicketTime,
    staffDisplayName,
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
          authorImage: string | null;
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
            authorImage: message.author?.image ?? null,
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
        <div className="mx-auto flex w-full max-w-3xl flex-col pb-24 md:p-6 md:pb-32">
            <header className="sticky top-0 z-30 -mx-2 flex items-center gap-2 border-b bg-background/80 px-2 py-2 backdrop-blur-md md:-mx-6 md:px-6">
                <Button asChild variant="ghost" size="icon" className="shrink-0">
                    <Link href="/support/tickets" aria-label={t('detail.back')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
                        {ticket.subject}
                    </h1>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <TicketStatusLabel
                            status={ticket.status}
                            label={t(`status.${ticket.status}`)}
                        />
                        <span className="shrink-0">· #{ticket.number}</span>
                    </div>
                </div>
                {ticket.status !== 'CLOSED' && <CloseTicketButton ticketId={ticket.id} />}
            </header>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-3 text-xs text-muted-foreground">
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

            <ol className="flex flex-col gap-3 py-4">
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
                    const isSystem = entry.authorRole === 'SYSTEM';
                    const name = own
                        ? t('detail.you')
                        : isSystem
                          ? t('detail.system')
                          : (entry.authorName ?? t('detail.supportTeam'));

                    return (
                        <li
                            key={`message-${entry.id}`}
                            className={cn('flex items-start gap-2', own && 'flex-row-reverse')}
                        >
                            <TicketAvatar
                                name={own ? getUserDisplayName(session.user) : name}
                                image={entry.authorImage}
                                system={isSystem}
                                className="mt-5"
                            />
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
                                            ? 'rounded-tr-sm bg-primary text-primary-foreground'
                                            : 'rounded-tl-sm border bg-card',
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
