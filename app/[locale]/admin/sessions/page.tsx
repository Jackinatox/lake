'use server';

import prisma from '@/lib/prisma';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import SessionsTable from './sessionsTable';
import { DbSession } from '@/models/prisma';
import { headers } from 'next/headers';

// type is in ./types to avoid client/server circular imports

export default async function AdminStripeSessionsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    // Read sessions from our local DB (GameServerOrder rows with stripeSessionId)
    const sessions: DbSession[] = await prisma.gameServerOrder.findMany({
        where: { stripeSessionId: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { user: { select: { email: true } } },
    });

    return (
        <div className="space-y-4">
            <AdminBreadcrumb items={[{ label: 'Stripe Sessions' }]} />

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Stripe Checkout Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    <SessionsTable sessions={sessions} />
                </CardContent>
            </Card>
        </div>
    );
}
