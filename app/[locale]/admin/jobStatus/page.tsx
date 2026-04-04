import { auth } from '@/auth';
import { headers } from 'next/headers';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { JobStatusPageClient } from './JobStatusPageClient';

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    return (
        <>
            <AdminBreadcrumb items={[{ label: 'Job Status' }]} />
            <JobStatusPageClient />
        </>
    );
}
