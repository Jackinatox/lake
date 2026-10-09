import {
    isTicketUnreadForCustomer,
    listCustomerTickets,
} from '@/app/data-access-layer/tickets/customerTickets';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import TicketBadge from '@/components/support/TicketBadge';
import { ticketCategoryIcons } from '@/components/support/TicketCategoryIcon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { SUPPORT_LANDING_PATH } from '@/lib/tickets/constants';
import { ticketStateStyles } from '@/lib/tickets/presentation';
import { cn } from '@/lib/utils';
import { ArrowLeft, Plus } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';

export default async function MyTicketsPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string }>;
}) {
    const [query, session] = await Promise.all([
        searchParams,
        auth.api.getSession({ headers: await headers() }),
    ]);

    if (!session) {
        return <NotLoggedIn />;
    }

    const [t, format, tickets] = await Promise.all([
        getTranslations('supportTickets'),
        getFormatter(),
        listCustomerTickets(session.user.id),
    ]);

    const showClosed = query.view === 'closed';
    const visible = tickets.filter((ticket) => (ticket.status === 'CLOSED') === showClosed);
    const openCount = tickets.filter((ticket) => ticket.status !== 'CLOSED').length;
    const closedCount = tickets.length - openCount;
    const now = new Date();

    const tabs = [
        {
            label: t('list.active'),
            count: openCount,
            href: '/support/tickets',
            active: !showClosed,
        },
        {
            label: t('list.closed'),
            count: closedCount,
            href: '/support/tickets?view=closed',
            active: showClosed,
        },
    ];

    return (
        <div className="mx-auto w-full max-w-3xl md:p-6">
            <Button asChild variant="ghost" size="sm" className="mb-2 gap-1 px-2">
                <Link href={SUPPORT_LANDING_PATH}>
                    <ArrowLeft className="h-4 w-4" />
                    {t('list.support')}
                </Link>
            </Button>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{t('list.title')}</h1>
                <Button asChild size="sm" className="gap-1">
                    <Link href="/support/tickets/new">
                        <Plus className="h-4 w-4" />
                        {t('list.newTicket')}
                    </Link>
                </Button>
            </div>

            <div className="mb-3 inline-flex rounded-lg bg-muted p-1 text-sm">
                {tabs.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            'rounded-md px-3 py-1.5 font-medium transition-colors',
                            tab.active
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {tab.label}
                        <span className="ml-1.5 text-xs text-muted-foreground">{tab.count}</span>
                    </Link>
                ))}
            </div>

            <Card className="overflow-hidden">
                {visible.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                        {showClosed ? t('list.emptyClosed') : t('list.empty')}
                    </p>
                ) : (
                    <ul className="divide-y">
                        {visible.map((ticket) => {
                            const unread = isTicketUnreadForCustomer(ticket);
                            const lastMessage = ticket.messages[0];
                            const Icon = ticketCategoryIcons[ticket.category];
                            return (
                                <li key={ticket.id}>
                                    <Link
                                        href={`/support/tickets/${ticket.id}`}
                                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                                    >
                                        <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                            <Icon className="h-4 w-4 text-primary" />
                                            {unread && (
                                                <span
                                                    className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary"
                                                    aria-label={t('list.unread')}
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'min-w-0 flex-1 truncate',
                                                        unread ? 'font-semibold' : 'font-medium',
                                                    )}
                                                >
                                                    {ticket.subject}
                                                </span>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {format.relativeTime(ticket.lastMessageAt, now)}
                                                </span>
                                            </div>
                                            {lastMessage && (
                                                <p
                                                    className={cn(
                                                        'mt-0.5 truncate text-sm',
                                                        unread
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground',
                                                    )}
                                                >
                                                    <span className="font-medium">
                                                        {lastMessage.authorRole === 'CUSTOMER'
                                                            ? t('list.you')
                                                            : t('list.team')}
                                                        :
                                                    </span>{' '}
                                                    {lastMessage.body}
                                                </p>
                                            )}
                                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <TicketBadge
                                                    className={ticketStateStyles[ticket.status]}
                                                >
                                                    {t(`status.${ticket.status}`)}
                                                </TicketBadge>
                                                <span>#{ticket.number}</span>
                                                <span>·</span>
                                                <span>
                                                    {t(`categories.${ticket.category}.title`)}
                                                </span>
                                                {ticket.gameServer && (
                                                    <>
                                                        <span>·</span>
                                                        <span className="truncate">
                                                            {ticket.gameServer.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </div>
    );
}
