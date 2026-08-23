import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { isValidWorkerJobName } from '@/lib/jobs/workerJobs';

export async function POST(request: Request, { params }: { params: Promise<{ jobName: string }> }) {
    // Check admin auth
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { jobName } = await params;

        // The worker decides which jobs exist; only reject names that are not a bare identifier
        // so they cannot escape the trigger path.
        if (!isValidWorkerJobName(jobName)) {
            return NextResponse.json({ error: 'Invalid job name' }, { status: 400 });
        }

        const workerUrl = process.env.WORKER_IP;
        const response = await fetch(
            `${workerUrl}/v1/jobs/trigger/${encodeURIComponent(jobName)}`,
            {
                method: 'POST',
            },
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Worker API error:', data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to trigger job:', error);
        return NextResponse.json(
            {
                error: 'Failed to trigger job',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
