import { NextResponse } from 'next/server';
import { env } from 'next-runtime-env';
import { auth } from '@/auth';
import { headers } from 'next/headers';

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const workerUrl = env('WORKER_IP');
        const response = await fetch(`${workerUrl}/v1/version`, {
            cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch version' }, { status: 500 });
    }
}
