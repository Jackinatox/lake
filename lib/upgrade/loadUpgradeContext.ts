import 'server-only';

import prisma from '@/lib/prisma';
import { resolveResourceTier } from '@/lib/resourceTier';
import type { PerformanceGroup, ResourceTierDisplay } from '@/models/prisma';
import type { ServerSpec } from './pricing';

const tierSelect = {
    id: true,
    name: true,
    diskMB: true,
    backups: true,
    ports: true,
    priceCents: true,
    enabled: true,
} as const;

export type UpgradeContext = {
    server: {
        id: string;
        ptServerId: string;
        userId: string;
        expires: Date;
        gameDataId: number;
        cpuPercent: number;
        ramMB: number;
        diskMB: number;
    };
    /** The server's location. Changing it is not possible (yet), see `docs/server-upgrade.md`. */
    location: PerformanceGroup;
    currentTier: ResourceTierDisplay | null;
    current: ServerSpec;
    /** Enabled tiers plus the current one (even if it was disabled since), in display order */
    tierOptions: ResourceTierDisplay[];
};

/**
 * Everything needed to price a change of a paid server, shared by the configurator page and
 * `checkoutAction` so both see the same data. `null` when the user does not own a paid,
 * non-deleted server with that Pterodactyl identifier.
 */
export async function loadUpgradeContext(
    ptServerId: string,
    userId: string,
): Promise<UpgradeContext | null> {
    const [server, allTiers] = await Promise.all([
        prisma.gameServer.findFirst({
            where: {
                ptServerId,
                userId,
                type: { not: 'FREE' },
                status: { notIn: ['DELETED', 'CREATION_FAILED'] },
            },
            include: { location: { include: { cpu: true, ram: true } } },
        }),
        prisma.resourceTier.findMany({
            orderBy: [{ sorting: 'asc' }, { id: 'asc' }],
            select: tierSelect,
        }),
    ]);

    if (!server || !server.ptServerId) return null;

    const currentTier = resolveResourceTier(allTiers, {
        resourceTierId: server.resourceTierId,
        diskMB: server.diskMB,
        backupCount: server.backupCount,
        allocations: server.allocations,
    });

    const tierOptions = allTiers.filter((tier) => tier.enabled || tier.id === currentTier?.id);

    return {
        server: {
            id: server.id,
            ptServerId: server.ptServerId,
            userId: server.userId,
            expires: server.expires,
            gameDataId: server.gameDataId,
            cpuPercent: server.cpuPercent,
            ramMB: server.ramMB,
            diskMB: server.diskMB,
        },
        location: server.location,
        currentTier,
        current: {
            cpuPercent: server.cpuPercent,
            ramMb: server.ramMB,
            tierId: currentTier?.id ?? null,
            tierPriceCents: currentTier?.priceCents ?? 0,
        },
        tierOptions,
    };
}
