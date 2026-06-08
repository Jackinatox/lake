import type { ResourceTierDisplay } from '@/models/prisma';

type ResourceTierSource = {
    resourceTierId?: number | null;
    diskMB: number;
    backupCount: number;
    allocations: number;
};

function sortAscending(tiers: ResourceTierDisplay[]) {
    return [...tiers].sort((a, b) => {
        if (a.diskMB !== b.diskMB) return a.diskMB - b.diskMB;
        if (a.backups !== b.backups) return a.backups - b.backups;
        if (a.ports !== b.ports) return a.ports - b.ports;
        return a.id - b.id;
    });
}

export function resolveResourceTier(
    tiers: ResourceTierDisplay[],
    source: ResourceTierSource,
): ResourceTierDisplay | null {
    if (tiers.length === 0) return null;

    if (source.resourceTierId) {
        const persisted = tiers.find((tier) => tier.id === source.resourceTierId);
        if (persisted) return persisted;
    }

    const exactMatch = tiers.find(
        (tier) =>
            tier.diskMB === source.diskMB &&
            tier.backups === source.backupCount &&
            tier.ports === source.allocations,
    );
    if (exactMatch) return exactMatch;

    const enabledTiers = sortAscending(tiers.filter((tier) => tier.enabled));
    if (enabledTiers.length === 0) return sortAscending(tiers).at(-1) ?? null;

    return (
        enabledTiers.find(
            (tier) =>
                tier.diskMB >= source.diskMB &&
                tier.backups >= source.backupCount &&
                tier.ports >= source.allocations,
        ) ??
        enabledTiers.at(-1) ??
        null
    );
}

export function resolveUpgradePreselectedTier(
    enabledTiers: ResourceTierDisplay[],
    source: {
        persistedResourceTierId?: number | null;
        currentDiskMB: number;
        currentDiskUsageMb: number;
    },
): ResourceTierDisplay | null {
    const sortedEnabled = sortAscending(enabledTiers.filter((tier) => tier.enabled));
    if (sortedEnabled.length === 0) return null;

    if (source.persistedResourceTierId) {
        const persisted = sortedEnabled.find((tier) => tier.id === source.persistedResourceTierId);
        if (persisted) return persisted;
    }

    const minimumDisk = Math.max(source.currentDiskMB, source.currentDiskUsageMb);
    return sortedEnabled.find((tier) => tier.diskMB >= minimumDisk) ?? sortedEnabled.at(-1) ?? null;
}

export function mergeUpgradeResourceTierOptions(
    enabledTiers: ResourceTierDisplay[],
    currentTier: ResourceTierDisplay | null,
): ResourceTierDisplay[] {
    if (!currentTier) return enabledTiers;
    if (enabledTiers.some((tier) => tier.id === currentTier.id)) return enabledTiers;
    return [currentTier, ...enabledTiers];
}
