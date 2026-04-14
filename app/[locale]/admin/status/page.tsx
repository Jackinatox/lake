import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { headers } from 'next/headers';
import StatusPage from './StatusComponent';

export default async function StatusPageRoute() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    return (
        <>
            <AdminBreadcrumb items={[{ label: 'System Status' }]} />
            <StatusPage />
        </>
    );
}
