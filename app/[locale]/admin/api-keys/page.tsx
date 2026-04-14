import { auth } from '@/auth';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import NoAdmin from '@/components/admin/NoAdminMessage';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import ApiKeysClient from './ApiKeysClient';

async function ApiKeysPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const apiKeys = await prisma.apikey.findMany({ orderBy: { createdAt: 'desc' } });

    return (
        <>
            <AdminBreadcrumb items={[{ label: 'API Keys' }]} />
            <ApiKeysClient initialKeys={apiKeys} />
        </>
    );
}

export default ApiKeysPage;
