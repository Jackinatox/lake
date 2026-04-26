'use server';

import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import { createPrivateMetadata, getMetadataCopy } from '@/lib/metadata';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import ChangeGameSelect from './ChangeGameSelect';

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
            title: copy.gameserverChangeGameTitle(copy.gameserverFallbackTitle),
            description: copy.gameserverChangeGameDescription(copy.gameserverFallbackTitle),
        });
    }

    const server = await getOwnedGameServerSummary(session.user.id, server_id);

    if (!server) {
        return createPrivateMetadata({
            title: copy.gameserverChangeGameTitle(copy.gameserverFallbackTitle),
            description: copy.gameserverChangeGameDescription(copy.gameserverFallbackTitle),
        });
    }

    return createPrivateMetadata({
        title: copy.gameserverChangeGameTitle(server.name),
        description: copy.gameserverChangeGameDescription(server.name),
    });
}

async function page({ params }: { params: Promise<{ locale: string; server_id: string }> }) {
    const serverId = (await params).server_id;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const gameserver = await getOwnedGameServerSummary(session.user.id, serverId);

    if (!gameserver || gameserver.status === 'CREATION_FAILED' || gameserver.status === 'DELETED') {
        return <NotAllowedMessage />;
    }

    return <ChangeGameSelect serverId={serverId} />;
}

export default page;
