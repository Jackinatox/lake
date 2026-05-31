'use server';

import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import ServerCreationFailed from '@/components/auth/ServerCreationFailed';
import ServerDeleted from '@/components/auth/ServerDeleted';
import ServerExpired from '@/components/auth/ServerExpired';
import ServerLoader, { ServerLoaderProps } from '@/components/gameserver/ServerLoader';
import { createPrivateMetadata, getMetadataCopy } from '@/lib/metadata';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import { env } from '@/lib/env';
import { headers } from 'next/headers';
import { GameConfig } from '@/models/config';
import { gameConfigSchema } from '@/lib/validation/order';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; server_id: string }>;
}): Promise<Metadata> {
    const { locale, server_id } = await params;
    const copy = getMetadataCopy(locale);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return createPrivateMetadata({
            title: copy.gameserverFallbackTitle,
            description: copy.gameserversDescription,
        });
    }

    const server = await getOwnedGameServerSummary(session.user.id, server_id);

    if (!server) {
        return createPrivateMetadata({
            title: copy.gameserverFallbackTitle,
            description: copy.gameserversDescription,
        });
    }

    return createPrivateMetadata({
        title: copy.gameserverDashboardTitle(server.name),
        description: copy.gameserverDashboardDescription(server.name, server.gameData?.name),
    });
}

async function serverCrap({ params }: { params: Promise<{ server_id: string }> }) {
    const serverId = (await params).server_id;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey) {
        return <NotLoggedIn />;
    }

    // actual server data
    const isServerValid = await getOwnedGameServerSummary(session.user.id, serverId);

    if (!isServerValid || !isServerValid.ptAdminId) {
        return <NotAllowedMessage />;
    }

    if (isServerValid.status === 'EXPIRED') {
        return <ServerExpired serverId={serverId} />;
    }

    if (isServerValid.status === 'DELETED') {
        return <ServerDeleted />;
    }

    if (isServerValid.status === 'CREATION_FAILED') {
        return <ServerCreationFailed serverId={serverId} />;
    }

    const ptApiKey = session.user.ptKey;
    const baseUrl = env('NEXT_PUBLIC_PTERODACTYL_URL')!;

    try {
        const pt = createPtClient();

        const [gameDataFeatures, adminServer] = await Promise.all([
            prisma.gameDataFeature.findMany({
                where: {
                    gameDataId: isServerValid.gameDataId,
                },
                include: {
                    feature: true,
                },
            }),
            pt.getServer(isServerValid.ptAdminId.toString()),
        ]);
        
        const eegg = await pt.getEgg(
            isServerValid.gameData.nestId.toString(),
            adminServer.egg.toString(),
        );

        const features = gameDataFeatures.map((gdf) => gdf.feature);

        const initialServer: ServerLoaderProps['initialServer'] = {
            egg_id: adminServer.egg,
            gameSlug: isServerValid.gameData.slug,
            gameConfig: gameConfigSchema.parse(isServerValid.gameConfig),
            type: isServerValid.type,
            expires: isServerValid.expires,
            defaultStartCommand: eegg.startup,
        };

        return (
            <div className="">
                <ServerLoader
                    serverId={serverId}
                    ptApiKey={ptApiKey}
                    baseUrl={baseUrl}
                    initialServer={initialServer}
                    features={features}
                />
            </div>
        );
    } catch (error) {
        return <> Error from pt API {error} </>;
    }
}

export default serverCrap;
