'use server';
import React, { Suspense } from 'react';
import { auth } from '@/auth';
import GameServersPage from './ServerTable';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { createPrivateMetadata, getMetadataCopy } from '@/lib/metadata';
import { headers } from 'next/headers';
import { env } from 'next-runtime-env';
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const copy = getMetadataCopy(locale);

    return createPrivateMetadata({
        title: copy.gameserversTitle,
        description: copy.gameserversDescription,
    });
}

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
        <div className="space-y-4 p-0 md:p-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}
