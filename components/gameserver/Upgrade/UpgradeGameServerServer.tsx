import { fetchPerformanceGroups } from '@/lib/actions';
import UpgradeGameServer from './UpgradeGameServer';
import { getGameServerConfig } from '@/app/data-access-layer/gameServer/getGameServerConfig';
import NotAllowedMessage from '@/components/auth/NotAllowedMessage';
import prisma from '@/lib/prisma';
import { mergeUpgradeResourceTierOptions, resolveResourceTier } from '@/lib/resourceTier';

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
    const [performanceOptions, minOptions, allResourceTiers] = await Promise.all([
        fetchPerformanceGroups(),
        getGameServerConfig(serverId, userId),
        prisma.resourceTier.findMany({
            orderBy: [{ sorting: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                name: true,
                diskMB: true,
                backups: true,
                ports: true,
                priceCents: true,
                enabled: true,
            },
        }),
    ]);

    if (!minOptions) {
        return <NotAllowedMessage />;
    }

    const resolvedCurrentTier =
        minOptions.resourceTier ??
        resolveResourceTier(allResourceTiers, {
            resourceTierId: minOptions.resourceTierId,
            diskMB: minOptions.diskMb,
            backupCount: minOptions.backupCount,
            allocations: minOptions.allocations,
        });

    const resourceTiers = mergeUpgradeResourceTierOptions(
        allResourceTiers.filter((tier) => tier.enabled),
        resolvedCurrentTier,
    );

    return (
        <div className="w-full max-w-7xl mx-auto">
            <UpgradeGameServer
                serverId={serverId}
                apiKey={apiKey}
                performanceOptions={performanceOptions}
                minOptions={{ ...minOptions, resourceTier: resolvedCurrentTier }}
                resourceTiers={resourceTiers}
            />
        </div>
    );
}
