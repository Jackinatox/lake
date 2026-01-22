import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import type { WorkerJobType, JobRunStatus } from '@/types/jobs';

export async function GET() {
    // Check admin auth
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch recent job runs from database using JobRun table
        const runs = await prisma.jobRun.findMany({
            distinct: ['jobType'],
            orderBy: {
                startedAt: 'desc',
            },
        });

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            runs: runs.map((run: any) => ({
                id: run.id,
                jobType: run.jobType as WorkerJobType,
                status: run.status as JobRunStatus,
                startedAt: new Date(run.startedAt).toISOString(),
                endedAt: run.endedAt ? new Date(run.endedAt).toISOString() : null,
                itemsProcessed: run.itemsProcessed,
                itemsTotal: run.itemsTotal,
                itemsFailed: run.itemsFailed,
                errorMessage: run.errorMessage,
            })),
        });
    } catch (error) {
        console.error('Failed to fetch job runs from database:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch job runs',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
