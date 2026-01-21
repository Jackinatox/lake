import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import type { WorkerJobType, JobRunStatus } from '@/types/jobs';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Check admin auth
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        
        // Fetch job run with logs from database
        const jobRun = await (prisma as any).jobRun.findUnique({
            where: { id },
            include: {
                logs: {
                    include: {
                        gameServer: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                            },
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        if (!jobRun) {
            return NextResponse.json({ error: 'Job run not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: jobRun.id,
            jobType: jobRun.jobType as WorkerJobType,
            status: jobRun.status as JobRunStatus,
            startedAt: new Date(jobRun.startedAt).toISOString(),
            endedAt: jobRun.endedAt ? new Date(jobRun.endedAt).toISOString() : null,
            itemsProcessed: jobRun.itemsProcessed,
            itemsTotal: jobRun.itemsTotal,
            itemsFailed: jobRun.itemsFailed,
            errorMessage: jobRun.errorMessage,
            errorStack: jobRun.errorStack,
            metadata: jobRun.metadata,
            logs: jobRun.logs.map((log: any) => ({
                id: log.id,
                jobType: log.jobType,
                jobRun: log.jobRun,
                level: log.level,
                message: log.message,
                details: log.details,
                gameServerId: log.gameServerId,
                userId: log.userId,
                createdAt: new Date(log.createdAt).toISOString(),
                gameServer: log.gameServer,
                user: log.user,
            })),
        });
    } catch (error) {
        console.error('Failed to fetch job run details from database:', error);
        return NextResponse.json(
            { error: 'Failed to fetch job run details', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
