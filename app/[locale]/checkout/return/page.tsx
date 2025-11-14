'use server';

import React from 'react';
import ServerReadyPoller from './ServerReadyPoller';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { headers } from 'next/headers';

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
    return (
        <div>
            <ServerReadyPoller sessionId={session_id} />
        </div>
    );
}
