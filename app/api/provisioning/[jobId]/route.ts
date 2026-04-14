import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { env } from 'next-runtime-env';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requiredStringSchema } from '@/lib/validation/common';

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
    _request: NextRequest,
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
        const parsedJobId = requiredStringSchema('Job ID', 191).safeParse(jobId);
        if (!parsedJobId.success) {
            return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
        }
        const order = await prisma.gameServerOrder.findFirst({
            where: {
                workerJobId: parsedJobId.data,
                userId: session.user.id,
            },
            select: { id: true },
        });
        if (!order) {
            return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
        }
        const workerUrl = env('WORKER_IP');
        const encodedJobId = encodeURIComponent(parsedJobId.data);

        const response = await fetch(`${workerUrl}/v1/queue/jobstatus/${encodedJobId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.warn(`Failed to fetch job status from worker: ${errorText}`, 'SYSTEM', {
                userId: session.user.id,
                details: { jobId: parsedJobId.data, workerStatus: response.status },
            });
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
