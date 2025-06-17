import React from 'react'
import ServerReadyPoller from "./ServerReadyPoller";


export default async function ReturnPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session_id = (await searchParams).session_id as string;
    return (
        <div>
            <ServerReadyPoller sessionId={session_id} />
        </div>
    )
}