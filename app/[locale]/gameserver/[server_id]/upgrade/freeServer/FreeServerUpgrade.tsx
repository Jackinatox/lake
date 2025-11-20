import { fetchPerformanceGroups } from '@/lib/actions';
import { getGameServerConfig } from '@/app/data-access-layer/gameServer/getGameServerConfig';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import { prisma } from '@/prisma';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import FreeServerUpgradeClient from './FreeServerUpgradeClient';
import { getKeyValueNumber } from '@/lib/keyValue';
import { FREE_TIER_DURATION_DAYS } from '@/app/GlobalConstants';

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
        <div className="w-full max-w-7xl mx-auto p-2 md:p-6">
            <FreeServerUpgradeClient
                serverId={serverId}
                server={server}
                performanceOptions={performanceOptions}
                minOptions={minOptions}
                freeConfig={freeConfig}
            />
        </div>
    );
}
