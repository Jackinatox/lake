"use server"

import React from 'react'
import ServerReadyPoller from "./ServerReadyPoller";
import { auth } from '@/auth';
import NotLoggedIn from '@/app/[locale]/(auth-pages)/serverPageAuth';


export default async function ReturnPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await auth();
    if (!session) {
        return <NotLoggedIn />
    }

    const session_id = (await searchParams).session_id as string;
    return (
        <div>
            <ServerReadyPoller sessionId={session_id} />
        </div>
    )
}