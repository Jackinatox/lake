import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import UpgradeGameServerServer from '@/components/gameserver/Upgrade/UpgradeGameServerServer';
import Loading from './loading';
import { headers } from 'next/headers';
import { Suspense } from 'react';

async function UpgradePage({ params }: { params: Promise<{ locale: string; server_id: string }> }) {
    const awaitedParams = await params;
    const { server_id } = awaitedParams;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user || !session.user.ptKey) {
        return <NotLoggedIn />;
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
