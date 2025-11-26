import { getGameServerConfig } from '@/app/data-access-layer/gameServer/getGameServerConfig';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import { fetchPerformanceGroups } from '@/lib/actions';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import prisma from '@/lib/prisma';

import FreeServerUpgradeClient from './FreeServerUpgradeClient';

interface FreeServerUpgradeProps {
    serverId: string;
    userId: string;
}

export default async function FreeServerUpgrade({ serverId, userId }: FreeServerUpgradeProps) {
    const [performanceOptions, minOptions, server, freeConfig] = await Promise.all([
        fetchPerformanceGroups(),
        getGameServerConfig(serverId, userId),
        prisma.gameServer.findFirst({
            where: { ptServerId: serverId, userId },
            include: { gameData: true },
        }),
        getFreeTierConfigCached()
    ]);

    if (!minOptions || !server) {
        return <NotAllowedMessage />;
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-0 md:p-6">
            <FreeServerUpgradeClient
                server={server}
                performanceOptions={performanceOptions}
                minOptions={minOptions}
                freeConfig={freeConfig}
            />
        </div>
    );
}
