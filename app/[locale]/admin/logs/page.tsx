import { auth } from '@/auth';
import LogViewer from '@/components/admin/logs/LogViewer';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLogsPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || session.user.role !== 'admin') {
        redirect('/');
    }

    return (
        <div className="container mx-auto p-0 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold md:text-3xl">Application Logs</h1>
                <p className="mt-2 text-sm text-muted-foreground">View and filter system logs</p>
            </div>
            <LogViewer />
        </div>
    );
}
