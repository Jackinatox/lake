'use server';

import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import ChangeGameConfigClient from './ChangeGameConfigClient';
import prisma from '@/lib/prisma';

import { headers } from 'next/headers';
import type { Game } from '@/models/config';

interface PageParams {
    locale: string;
    server_id: string;
    gameId: string;
}

async function Page({
    params,
    searchParams,
}: {
    params: Promise<PageParams>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { server_id: serverId, gameId } = await params;
    const search = await searchParams;
    // If deleteFiles param is explicitly 'false', then deleteFiles = false, otherwise default to true
    const deleteFiles = search.deleteFiles !== 'false';

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const [gameServer, game] = await Promise.all([
        prisma.gameServer.findFirst({
            where: {
                ptServerId: serverId,
                userId: session.user.id,
                status: {
                    notIn: ['CREATION_FAILED', 'DELETED'],
                },
            },
            include: {
                gameData: {
                    select: {
                        name: true,
                    },
                },
            },
        }),
        prisma.gameData.findUnique({
            where: {
                id: Number.parseInt(gameId, 10),
            },
            select: {
                id: true,
                name: true,
                data: true,
            },
        }),
    ]);

    if (!gameServer) {
        return <NotAllowedMessage />;
    }

    if (!game || !game.data) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <div className="text-center text-sm text-muted-foreground">
                    We couldn&apos;t load the configuration details for this game yet.
                </div>
            </div>
        );
    }

    const gameForConfig: Game = {
        id: game.id,
        name: game.name ?? 'Unknown game',
        data: game.data as Record<string, unknown>,
    };

    return (
        <div className="mx-auto w-full max-w-5xl md:px-4 md:py-6 sm:py-10">
            <ChangeGameConfigClient
                serverId={serverId}
                game={gameForConfig}
                currentGameName={gameServer.gameData?.name.toLowerCase() ?? null}
                currentGameId={gameServer.gameDataId}
                defaultDeleteFiles={deleteFiles}
            />
        </div>
    );
}

export default Page;
