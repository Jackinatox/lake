import { getOwnedGameServerSummary } from '@/app/data-access-layer/gameServer/getOwnedGameServerSummary';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import UpgradeGameServerServer from '@/components/gameserver/Upgrade/UpgradeGameServerServer';
import Loading from './loading';
import { createPrivateMetadata, getMetadataCopy } from '@/lib/metadata';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';

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
            title: copy.gameserverUpgradeTitle(copy.gameserverFallbackTitle),
            description: copy.gameserverUpgradeDescription(copy.gameserverFallbackTitle),
        });
    }

    const server = await getOwnedGameServerSummary(session.user.id, server_id);

    if (!server) {
        return createPrivateMetadata({
            title: copy.gameserverUpgradeTitle(copy.gameserverFallbackTitle),
            description: copy.gameserverUpgradeDescription(copy.gameserverFallbackTitle),
        });
    }

    return createPrivateMetadata({
        title: copy.paidGameserverUpgradeTitle(server.name),
        description: copy.paidGameserverUpgradeDescription(server.name),
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

    if (server.type === 'FREE') {
        redirect(`/gameserver/${server_id}/upgrade/freeServer`);
    }

    return (
        <div className="flex justify-center w-full">
            <Suspense fallback={<Loading />}>
                <UpgradeGameServerServer
                    serverId={server_id}
                    apiKey={session.user.ptKey}
                    userId={session.user.id}
                />
            </Suspense>
        </div>
    );
}

export default UpgradePage;
