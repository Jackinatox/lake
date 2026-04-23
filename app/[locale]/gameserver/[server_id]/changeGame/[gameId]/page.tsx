'use server';

import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import ChangeGameConfigClient from './ChangeGameConfigClient';
import prisma from '@/lib/prisma';
import { z } from '@/lib/validation/common';

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
    const parsedGameId = z
        .string()
        .trim()
        .regex(/^[1-9]\d*$/, 'Game ID must be a positive integer')
        .safeParse(gameId);
    const deleteFilesParam = Array.isArray(search.deleteFiles)
        ? search.deleteFiles[0]
        : search.deleteFiles;
    const deleteFiles = deleteFilesParam === 'false' ? false : true;

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
                id: parsedGameId.success ? Number(parsedGameId.data) : -1,
            },
            select: {
                id: true,
                slug: true,
                name: true,
                data: true,
            },
        }),
    ]);

    if (!gameServer) {
        return <NotAllowedMessage />;
    }

    if (!parsedGameId.success || !game || !game.data) {
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
        slug: game.slug,
        name: game.name ?? 'Unknown game',
        data: game.data as Record<string, unknown>,
    };

    return (
        <div className="w-full">
            <ChangeGameConfigClient
                serverId={serverId}
                game={gameForConfig}
                currentGameName={gameServer.gameData?.name.toLowerCase() ?? null}
                currentGameEggId={gameServer.gameDataId}
                defaultDeleteFiles={deleteFiles}
            />
        </div>
    );
}

export default Page;
