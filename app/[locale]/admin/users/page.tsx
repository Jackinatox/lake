'use server';

import { Builder } from '@avionrx/pterodactyl-js';
import UsersTable from './usersTable';
import { env } from 'next-runtime-env';
import { SettingsIcon, UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { prisma } from '@/prisma';

export default async function AdminPage() {
    const url = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const apiKey = env('PTERODACTYL_API_KEY');
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
