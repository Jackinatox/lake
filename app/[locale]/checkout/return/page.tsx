'use server';

import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { headers } from 'next/headers';
import ServerReadyPoller from './ServerReadyPoller';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function ReturnPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const session_id = (await searchParams).session_id as string;

    if (!session_id) {
        return <div>Invalid session ID.</div>;
    }
    return (
        <div>
            <ServerReadyPoller sessionId={session_id} />
        </div>
    );
}
