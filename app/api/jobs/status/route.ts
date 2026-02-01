import { NextResponse } from 'next/server';
import { env } from 'next-runtime-env';
import { auth } from '@/auth';
import { headers } from 'next/headers';

export async function GET() {
    // Check admin auth
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const workerUrl = env('WORKER_IP');
        const response = await fetch(`${workerUrl}/v1/jobs/status`, {
            cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Worker API error:', data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Failed to fetch job status:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch job status',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
