import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
        const jobRun = await prisma.jobRun.findUnique({
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
                                username: true,
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

        return NextResponse.json(jobRun);
    } catch (error) {
        console.error('Failed to fetch job run details from database:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch job run details',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
