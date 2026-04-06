import { auth } from '@/auth';
import { headers } from 'next/headers';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import UsersPageClient from './usersPageClient';

export default async function AdminUsersPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    return (
        <>
            <AdminBreadcrumb items={[{ label: 'Users' }]} />
            <UsersPageClient />
        </>
    );
}
