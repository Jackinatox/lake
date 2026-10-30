import { NextResponse } from 'next/server';

const isDev = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development';

/**
 * Dev only: whether the provisioning worker answers, for the status dot in the navbar
 * (components/dev/WorkerStatusIndicator.tsx). 404 everywhere else.
 */
export async function GET() {
    if (!isDev) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    try {
        const response = await fetch(`${process.env.WORKER_IP}/v1/version`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(3000),
        });
        return NextResponse.json({ online: response.ok });
    } catch {
        return NextResponse.json({ online: false });
    }
}
