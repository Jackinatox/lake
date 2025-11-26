import { getGameServerConfig } from '@/app/data-access-layer/gameServer/getGameServerConfig';
import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import UpgradeGameServerFromFree from '@/components/gameserver/Upgrade/freeToPayed/UpgradeFreeToPayed';
import { Button } from '@/components/ui/button';
import { fetchPerformanceGroups } from '@/lib/actions';
import prisma from '@/lib/prisma';

import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function page({ params }: { params: Promise<{ locale: string; server_id: string }> }) {
    const awaitedParams = await params;
    const { server_id } = awaitedParams;
    const t = await getTranslations('freeServerUpgrade');

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

    if (!server.freeServer) {
        redirect(`/gameserver/${server_id}/upgrade/payedServer`);
    }

    const [performanceOptions, minOptions, fullServer] = await Promise.all([
        fetchPerformanceGroups(),
        getGameServerConfig(server_id, session.user.id),
        prisma.gameServer.findFirst({
            where: { ptServerId: server_id, userId: session.user.id },
            include: { gameData: true },
        }),
    ]);

    if (!minOptions || !fullServer || !server.ptServerId) {
        return <NotAllowedMessage />;
    }

    return (
        <div className="flex justify-center w-full">
            <div className="w-full max-w-7xl md:p-6 space-y-4 md:space-y-6">
                <Button variant="outline" asChild>
                    <Link href={`/gameserver/${server_id}/upgrade/freeServer`}>
                        ← {t('backToOptions')}
                    </Link>
                </Button>

                <h1 className="text-2xl md:text-3xl font-bold text-center mt-8 text-red-500">
                    This upgrade option will be available later.
                </h1>
                {/* <UpgradeGameServerFromFree
                    serverId={server.ptServerId}
                    performanceOptions={performanceOptions}
                    minOptions={minOptions}
                /> */}
            </div>
        </div>
    );
}

export default page;
