import { fetchPerformanceGroups } from '@/lib/actions';
import UpgradeGameServer from './UpgradeGameServer';
import { getGameServerConfig } from '@/app/data-access-layer/gameServer/getGameServerConfig';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import prisma from '@/lib/prisma';

import { redirect } from 'next/navigation';

interface UpgradeGameServerServerProps {
    serverId: string;
    apiKey: string;
    userId: string;
}

export default async function UpgradeGameServerServer({
    serverId,
    apiKey,
    userId,
}: UpgradeGameServerServerProps) {
    const performanceOptions = await fetchPerformanceGroups();
    const minOptions = await getGameServerConfig(serverId, userId);

    if (!minOptions) {
        return <NotAllowedMessage />;
    }

    return (
        <div className="w-full max-w-7xl mx-auto">
            <UpgradeGameServer
                serverId={serverId}
                apiKey={apiKey}
                performanceOptions={performanceOptions}
                minOptions={minOptions}
            />
        </div>
    );
}
