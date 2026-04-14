import React from 'react';
import ProvisionServerTest from './provision-server-test';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';

async function page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role != 'admin') return <NoAdmin />;

    return (
        <div>
            <AdminBreadcrumb items={[{ label: 'Provision By Id' }]} />
            <ProvisionServerTest />
        </div>
    );
}

export default page;
