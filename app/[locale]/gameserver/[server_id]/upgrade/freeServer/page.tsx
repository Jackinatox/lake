import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import { createPrivateMetadata, getMetadataCopy } from '@/lib/metadata';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from '../payedServer/loading';
import FreeServerUpgrade from './FreeServerUpgrade';

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
            title: copy.freeGameserverUpgradeTitle(copy.gameserverFallbackTitle),
            description: copy.freeGameserverUpgradeDescription(copy.gameserverFallbackTitle),
        });
    }

    const server = await getOwnedGameServerSummary(session.user.id, server_id);

    if (!server) {
        return createPrivateMetadata({
            title: copy.freeGameserverUpgradeTitle(copy.gameserverFallbackTitle),
            description: copy.freeGameserverUpgradeDescription(copy.gameserverFallbackTitle),
        });
    }

    return createPrivateMetadata({
        title: copy.freeGameserverUpgradeTitle(server.name),
        description: copy.freeGameserverUpgradeDescription(server.name),
    });
}

async function UpgradePage({ params }: { params: Promise<{ locale: string; server_id: string }> }) {
    const awaitedParams = await params;
    const { server_id } = awaitedParams;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey) {
        return <NotLoggedIn />;
    }

    const server = await getOwnedGameServerSummary(session.user.id, server_id);

    if (!server) {
        return <NotAllowedMessage />;
    }

    if (server.type !== 'FREE') {
        redirect(`/gameserver/${server_id}/upgrade/payedServer`);
    }

    return (
        <div className="flex justify-center w-full">
            <Suspense fallback={<Loading />}>
                <FreeServerUpgrade serverId={server_id} userId={session.user.id} />
            </Suspense>
        </div>
    );
}

export default UpgradePage;
