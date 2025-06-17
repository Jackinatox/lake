import React from 'react'

export default async function ReturnPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session_id = (await searchParams).session_id;
    return (
        <div>{session_id}</div>
    )
}