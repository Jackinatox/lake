import type { ResourceTierDisplay } from '@/models/prisma';

/** What the server currently uses in Pterodactyl — read by `fetchServerUsage`. */
export type ServerUsage = {
    diskUsageMb: number;
    backupCount: number;
    allocationCount: number;
};

export type TierBlocker =
    /** Disabled tier that is not the server's current one */
    | { kind: 'unavailable' }
    /** Usage could not be read, so nothing smaller than the current tier is allowed */
    | { kind: 'usageUnknown' }
    | { kind: 'disk'; usedMb: number }
    | { kind: 'backups'; used: number }
    | { kind: 'ports'; used: number };

/**
 * Why `tier` cannot be picked for this server (empty = allowed). A smaller tier is fine as
 * long as what the server already uses still fits: disk usage, existing backups and
 * assigned ports. Used by the configurator and re-checked in `checkoutAction`.
 */
export function tierBlockers(
    tier: ResourceTierDisplay,
    currentTier: ResourceTierDisplay | null,
    usage: ServerUsage | null,
): TierBlocker[] {
    const isCurrent = currentTier?.id === tier.id;
    if (isCurrent) return [];
    if (!tier.enabled) return [{ kind: 'unavailable' }];

    if (!usage) {
        const smaller =
            !currentTier ||
            tier.diskMB < currentTier.diskMB ||
            tier.backups < currentTier.backups ||
            tier.ports < currentTier.ports;
        return smaller ? [{ kind: 'usageUnknown' }] : [];
    }

    const blockers: TierBlocker[] = [];
    if (tier.diskMB < usage.diskUsageMb) blockers.push({ kind: 'disk', usedMb: usage.diskUsageMb });
    if (tier.backups < usage.backupCount)
        blockers.push({ kind: 'backups', used: usage.backupCount });
    if (tier.ports < usage.allocationCount)
        blockers.push({ kind: 'ports', used: usage.allocationCount });
    return blockers;
}
