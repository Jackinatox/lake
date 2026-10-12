import {
    isTicketUnreadForCustomer,
    listCustomerTickets,
} from '@/app/data-access-layer/tickets/customerTickets';
import { auth } from '@/auth';
import SupportEmailHint from '@/components/support/SupportEmailHint';
import { ticketCategoryIcons } from '@/components/support/TicketCategoryIcon';
import TicketStatusLabel from '@/components/support/TicketStatusLabel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { serverConfig } from '@/lib/serverConfig';
import { cn } from '@/lib/utils';
import { LogIn, Plus } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

type SearchParams = { view?: string; category?: string; subject?: string; server?: string };

/**
 * The support page: the customer's tickets, the button to open a new one and the email address.
 *
 * `?category=&subject=&server=` deep links (the legacy `/support` format) are forwarded straight
 * to the ticket form.
 */
export default async function SupportTicketsPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<SearchParams>;
}) {
    const [{ locale }, query, session] = await Promise.all([
        params,
        searchParams,
        auth.api.getSession({ headers: await headers() }),
    ]);

    if (query.category || query.subject || query.server) {
        const forward = new URLSearchParams();
        if (query.category) forward.set('category', query.category);
        if (query.subject) forward.set('subject', query.subject);
        if (query.server) forward.set('server', query.server);
        redirect(`/${locale}/support/tickets/new?${forward.toString()}`);
    }

    const [t, format, tickets] = await Promise.all([
        getTranslations('supportTickets'),
        getFormatter(),
        session ? listCustomerTickets(session.user.id) : [],
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
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col gap-6 pb-24 md:gap-8 md:px-6 md:pb-32">
            <header className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-end sm:justify-between md:pt-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        {t.rich('landing.title', {
                            highlight: (chunks) => <span className="text-primary">{chunks}</span>,
                        })}
                    </h1>
                    <p className="max-w-xl text-muted-foreground">{t('landing.subtitle')}</p>
                </div>
                {session && (
                    <Button asChild className="shrink-0 gap-1.5">
                        <Link href="/support/tickets/new">
                            <Plus className="h-4 w-4" />
                            {t('list.newTicket')}
                        </Link>
                    </Button>
                )}
            </header>

            <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight">
                        {t('landing.yourTickets')}
                    </h2>
                    {session && (
                        <nav className="flex items-center gap-1 text-sm">
                            {tabs.map((tab) => (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    scroll={false}
                                    aria-current={tab.active ? 'page' : undefined}
                                    className={cn(
                                        'rounded-md px-2.5 py-1 transition-colors',
                                        tab.active
                                            ? 'bg-accent font-medium text-accent-foreground'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {tab.label}
                                    <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                                        {tab.count}
                                    </span>
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                <Card className="overflow-hidden">
                    {!session ? (
                        <p className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
                            <LogIn className="h-4 w-4 shrink-0" />
                            <span>
                                {t.rich('landing.loginHint', {
                                    strong: (chunks) => (
                                        <Link
                                            href="/login"
                                            className="font-medium text-foreground underline underline-offset-4"
                                        >
                                            {chunks}
                                        </Link>
                                    ),
                                })}
                            </span>
                        </p>
                    ) : visible.length === 0 ? (
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
                                                            unread
                                                                ? 'font-semibold'
                                                                : 'font-medium',
                                                        )}
                                                    >
                                                        {ticket.subject}
                                                    </span>
                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                        {format.relativeTime(
                                                            ticket.lastMessageAt,
                                                            now,
                                                        )}
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
                                                    <TicketStatusLabel
                                                        status={ticket.status}
                                                        label={t(`status.${ticket.status}`)}
                                                    />
                                                    <span>·</span>
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
            </section>

            <SupportEmailHint email={serverConfig().supportEmail} />
        </div>
    );
}
