import { JobStatusCard } from './Job-Status-Card';
import { ErrorSection } from './ErrorSection';
import { JobStatus } from '../../../../worker/workerTypes';
import { prisma } from '@/prisma';
import { env } from 'next-runtime-env';

// Async function to fetch job statuses
async function getJobStatuses(): Promise<any[]> {
    try {
        const response = await fetch(`${env('WORKER_IP')}/status`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch job statuses');
        return (await response.json()).jobs;
    } catch (error) {
        return [];
    }
}

export async function JobStatusList() {
    const jobStatuses = await getJobStatuses();
    const errorCount = await prisma.workerLog.count({
        where: {
            level: { in: ['ERROR', 'FATAL'] },
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
            },
        },
    });

    const recentErrors = await prisma.workerLog.findMany({
        where: {
            level: { in: ['ERROR', 'FATAL'] },
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
            },
        },
        include: {
            gameServer: {
                select: { id: true, name: true, status: true },
            },
            user: {
                select: { id: true, name: true, email: true },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 100, // Show last 100 errors
    });

    return (
        <div className="px-1 md:px-0">
            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                {jobStatuses.length > 0 ? (
                    jobStatuses.map((job) => {
                        return <JobStatusCard key={job.name} job={job} jobName={job.name} />;
                    })
                ) : (
                    <p className="text-red-600">Could not fetch Jobs</p>
                )}
            </div>

            <ErrorSection errorCount={errorCount} recentErrors={recentErrors} />
        </div>
    );
}
