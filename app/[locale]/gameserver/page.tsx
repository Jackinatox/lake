'use server';
import React, { Suspense } from 'react';
import { auth } from '@/auth';
import GameServersPage from './ServerTable';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { headers } from 'next/headers';
import { env } from 'next-runtime-env';
import { Skeleton } from '@/components/ui/skeleton';

async function UserServer() {
    const baseUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const apiKey = env('PTERODACTYL_API_KEY');

    if (!baseUrl || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    return (
        <Suspense fallback={<GameServersSkeleton />}>
            <GameServersPage></GameServersPage>
        </Suspense>
    );
}

export default UserServer;

function GameServersSkeleton() {
    return (
        <div className="space-y-4 p-2 md:p-6">
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}
