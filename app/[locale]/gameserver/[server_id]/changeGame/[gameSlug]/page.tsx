'use server';

import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import ChangeGameConfigClient from './ChangeGameConfigClient';
import prisma from '@/lib/prisma';
import { z } from '@/lib/validation/common';

import { headers } from 'next/headers';
import type { Game, GameConfig } from '@/models/config';

interface PageParams {
    locale: string;
    server_id: string;
    gameSlug: string;
}

async function Page({
    params,
    searchParams,
}: {
    params: Promise<PageParams>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { server_id: serverId, gameSlug } = await params;
    const search = await searchParams;
    const parsedGameSlug = z
        .string()
        .trim()
        .safeParse(gameSlug);
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
        prisma.gameData.findFirst({
            where: {
                slug: parsedGameSlug.data,
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

    if (!parsedGameSlug.success || !game || !game.data) {
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
                currentGameEggId={(gameServer.gameConfig as unknown as GameConfig).eggId}
                defaultDeleteFiles={deleteFiles}
            />
        </div>
    );
}

export default Page;
