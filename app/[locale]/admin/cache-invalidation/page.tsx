'use server';

import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { headers } from 'next/headers';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CacheInvalidationClient from './CacheInvalidationClient';

export default async function CacheInvalidationPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <AdminBreadcrumb items={[{ label: 'Cache Invalidation' }]} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Cache Invalidation Manager
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CacheInvalidationClient />
                </CardContent>
            </Card>
        </div>
    );
}
