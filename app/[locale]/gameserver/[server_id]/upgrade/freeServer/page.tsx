import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import prisma from '@/lib/prisma';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from '../payedServer/loading';
import FreeServerUpgrade from './FreeServerUpgrade';

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

    if (server.type !== 'FREE') {
        redirect(`/gameserver/${server_id}/upgrade/payedServer`);
    }

    return <div className="flex justify-center w-full">
        <Suspense fallback={<Loading />}>
            <FreeServerUpgrade serverId={server_id} userId={session.user.id} />
        </Suspense>
    </div>;
}

export default UpgradePage;
