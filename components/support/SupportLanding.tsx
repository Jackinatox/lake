import EmailAndCopyButton from '@/app/[locale]/support/EmailAndCopyButton';
import {
    isTicketUnreadForCustomer,
    listCustomerTickets,
} from '@/app/data-access-layer/tickets/customerTickets';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { serverConfig } from '@/lib/serverConfig';
import { TICKET_CATEGORIES } from '@/lib/tickets/constants';
import { ticketStateStyles } from '@/lib/tickets/presentation';
import { ChevronRight, MessagesSquare } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import TicketBadge from './TicketBadge';
import { ticketCategoryIcons } from './TicketCategoryIcon';

/**
 * Landing page of the new ticket system. Lives at `SUPPORT_LANDING_PATH` until it replaces the
 * legacy `/support` page.
 */
export default async function SupportLanding() {
    const [t, format, session] = await Promise.all([
        getTranslations('supportTickets'),
        getFormatter(),
        auth.api.getSession({ headers: await headers() }),
    ]);

    const activeTickets = session
        ? (await listCustomerTickets(session.user.id))
              .filter((ticket) => ticket.status !== 'CLOSED')
              .slice(0, 5)
        : [];
    const now = new Date();

    return (
        <section className="w-full">
            <div className="mx-auto max-w-6xl px-0 pt-6 md:px-8 md:pt-10">
                <div className="space-y-4 text-center">
                    <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                        {t.rich('landing.title', {
                            highlight: (chunks) => (
                                <span className="text-primary drop-shadow-sm">{chunks}</span>
                            ),
                        })}
                    </h1>
                    <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
                        {t('landing.subtitle')}
                    </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:mt-10">
                    {TICKET_CATEGORIES.map((category) => {
                        const Icon = ticketCategoryIcons[category];
                        return (
                            <Link
                                key={category}
                                href={`/support/tickets/new?category=${category}`}
                                className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium">
                                        {t(`categories.${category}.title`)}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t(`categories.${category}.description`)}
                                    </p>
                                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                                        {t('landing.openTicket')}
                                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:gap-6">
                    <Card className="flex-1 rounded-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessagesSquare className="h-4 w-4 text-primary" />
                                {t('landing.yourTickets')}
                            </CardTitle>
                            {!session && (
                                <CardDescription>
                                    {t.rich('landing.loginHint', {
                                        strong: (chunks) => (
                                            <Link
                                                href="/login"
                                                className="font-semibold text-foreground underline underline-offset-4"
                                            >
                                                {chunks}
                                            </Link>
                                        ),
                                    })}
                                </CardDescription>
                            )}
                        </CardHeader>
                        {session && (
                            <CardContent className="space-y-3">
                                {activeTickets.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        {t('landing.noActiveTickets')}
                                    </p>
                                ) : (
                                    <ul className="divide-y rounded-md border">
                                        {activeTickets.map((ticket) => {
                                            const unread = isTicketUnreadForCustomer(ticket);
                                            return (
                                                <li key={ticket.id}>
                                                    <Link
                                                        href={`/support/tickets/${ticket.id}`}
                                                        className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-accent/50"
                                                    >
                                                        <span
                                                            className={`h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-primary' : 'bg-transparent'}`}
                                                        />
                                                        <span
                                                            className={`min-w-0 flex-1 truncate ${unread ? 'font-semibold' : ''}`}
                                                        >
                                                            {ticket.subject}
                                                        </span>
                                                        <TicketBadge
                                                            className={
                                                                ticketStateStyles[ticket.status]
                                                            }
                                                        >
                                                            {t(`status.${ticket.status}`)}
                                                        </TicketBadge>
                                                        <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground sm:inline">
                                                            {format.relativeTime(
                                                                ticket.lastMessageAt,
                                                                now,
                                                            )}
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/support/tickets">{t('landing.viewAll')}</Link>
                                </Button>
                            </CardContent>
                        )}
                    </Card>
                    <EmailAndCopyButton SUPPORT_EMAIL={serverConfig().supportEmail} />
                </div>
            </div>
        </section>
    );
}
