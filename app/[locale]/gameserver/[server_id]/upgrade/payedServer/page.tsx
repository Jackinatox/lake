import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import UpgradeGameServerServer from '@/components/gameserver/Upgrade/UpgradeGameServerServer';
import Loading from './loading';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import prisma from '@/lib/prisma';

import { redirect } from 'next/navigation';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';

async function UpgradePage({ params }: { params: Promise<{ locale: string; server_id: string }> }) {
    const awaitedParams = await params;
    const { server_id } = awaitedParams;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey) {
        return <NotLoggedIn />;
    }

    const server = await prisma.gameServer.findFirst({
        where: {
            ptServerId: server_id,
            userId: session.user.id,
        },
    });

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
