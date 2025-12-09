import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { headers } from 'next/headers';
import StatusPage from './StatusComponent';

export default async function () {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    return <StatusPage />;
}
