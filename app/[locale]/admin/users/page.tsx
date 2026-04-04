'use server';

import UsersTable from './usersTable';
import { UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import prisma from '@/lib/prisma';

export default async function AdminPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    try {
        const users = await prisma.user.findMany();

        return (
            <>
                <AdminBreadcrumb items={[{ label: 'Users' }]} />
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>
                            <UsersIcon className="inline-block mr-2" /> Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UsersTable users={users} />
                    </CardContent>
                </Card>
            </>
        );
    } catch (error: any) {
        return (
            <div>
                <h1>Error</h1>
                <p>{error.message}</p>
            </div>
        );
    }
}
