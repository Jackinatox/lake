import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { Button } from '@/components/ui/button';
import TicketsDashboard, { AdminTicket } from './TicketsDashboard';
import prisma from '@/lib/prisma';

import { headers } from 'next/headers';
import { InboxIcon } from 'lucide-react';
import Link from 'next/link';

export default async function TicketsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const tickets = await prisma.supportTicket.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    username: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const serialised: AdminTicket[] = tickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        message: ticket.message,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        user: ticket.user,
    }));

    return (
        <div className="flex w-full flex-col gap-6">
            <AdminBreadcrumb items={[{ label: 'Tickets (legacy)' }]} />
            <div className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-50 p-4 text-sm dark:bg-amber-950/30 sm:flex-row sm:items-center">
                <InboxIcon className="hidden h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:block" />
                <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-medium">Legacy tickets — no longer supported</p>
                    <p className="text-muted-foreground">
                        Customers now open tickets in the new system. This list only holds old
                        contact form requests (email-only follow-up) and will be removed.
                    </p>
                </div>
                <Button asChild size="sm" className="shrink-0 self-start sm:self-center">
                    <Link href="/admin/support">Open Support Inbox</Link>
                </Button>
            </div>
            <TicketsDashboard tickets={serialised} />
        </div>
    );
}
