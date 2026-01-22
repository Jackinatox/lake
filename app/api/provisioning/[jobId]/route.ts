import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { env } from 'next-runtime-env';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface JobStatusResponse {
    success: boolean;
    jobId: string;
    state: 'queued' | 'active' | 'completed' | 'failed';
    data?: {
        orderId: number;
        ptServerId?: string;
        ptAdminId?: number;
    };
    attemptsMade?: number;
    progress?: number;
    error?: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> },
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId } = await params;
        const workerUrl = env('WORKER_IP');

        const response = await fetch(`${workerUrl}/v1/queue/jobstatus/${jobId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.warn(`Failed to fetch job status from worker: ${errorText}`, 'SYSTEM');
            return NextResponse.json(
                { success: false, error: `Failed to fetch job status: ${errorText}` },
                { status: response.status },
            );
        }

        const data: JobStatusResponse = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching job status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch job status' },
            { status: 500 },
        );
    }
}
