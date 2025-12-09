import { Suspense } from 'react';
import { JobStatusSkeleton } from './Job-Status-Sekelton';
import { ErrorLogSection, JobStatusGrid } from './Job-Status-List';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import NoAdmin from '@/components/admin/NoAdminMessage';

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }
    return (
        <main className="min-h-screen bg-background p-0 md:p-2">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-semibold text-foreground mb-2">Worker Status</h1>
                    <p className="text-muted-foreground">
                        Monitor the status and progress of background jobs
                    </p>
                </header>

                <div className="px-1 md:px-0">
                    <Suspense fallback={<JobStatusSkeleton />}>
                        <JobStatusGrid />
                    </Suspense>

                    <ErrorLogSection />
                </div>
            </div>
        </main>
    );
}
