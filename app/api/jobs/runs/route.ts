import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

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
            omit: {
                errorStack: true,
                metadata: true,
            },
        });

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            runs,
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
