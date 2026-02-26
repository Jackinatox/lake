'use server';

import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { headers } from 'next/headers';
import { Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getKeyValuesAction } from '@/app/actions/keyvalue/keyValueActions';
import KeyValueClient from './KeyValueClient';

export default async function KeyValuePage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const entries = await getKeyValuesAction();

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                href="/admin"
                                className="flex items-center gap-2 text-muted-foreground"
                            >
                                <Database className="h-4 w-4" />
                                Admin Panel
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin/keyvalue" className="text-foreground">
                                Key-Value Store
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Key-Value Store
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <KeyValueClient initialEntries={entries} />
                </CardContent>
            </Card>
        </div>
    );
}
