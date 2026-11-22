import 'server-only';

import { logger } from '@/lib/logger';
import type { ServerUsage } from './tierEligibility';

const USAGE_TIMEOUT_MS = 5000;

/**
 * Reads what a server currently uses from the Pterodactyl client API with the owner's key:
 * disk (`/resources`, as last reported by Wings — it lags a few minutes behind deletions),
 * the number of existing backups and the number of assigned ports. Returns `null` if any
 * call fails; callers then only allow tiers that are not smaller than the current one.
 */
export async function fetchServerUsage(
    ptServerId: string,
    ptKey: string,
): Promise<ServerUsage | null> {
    const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
    if (!panelUrl) return null;

    const get = async (path: string) => {
        const res = await fetch(`${panelUrl}/api/client/servers/${ptServerId}${path}`, {
            headers: { Authorization: `Bearer ${ptKey}`, Accept: 'application/json' },
            cache: 'no-store',
            signal: AbortSignal.timeout(USAGE_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`${path} answered ${res.status}`);
        return res.json();
    };

    try {
        const [resources, backups, allocations] = await Promise.all([
            get('/resources'),
            get('/backups?per_page=1'),
            get('/network/allocations'),
        ]);

        const diskBytes = Number(resources?.attributes?.resources?.disk_bytes ?? NaN);
        const backupCount = Number(backups?.meta?.pagination?.total ?? NaN);
        const allocationCount = Array.isArray(allocations?.data) ? allocations.data.length : NaN;

        if (![diskBytes, backupCount, allocationCount].every(Number.isFinite)) {
            throw new Error('Unexpected response shape');
        }

        return {
            diskUsageMb: Math.ceil(diskBytes / 1024 / 1024),
            backupCount,
            allocationCount,
        };
    } catch (error) {
        logger.warn('Could not read server usage for upgrade', 'GAME_SERVER', {
            details: { ptServerId, error: error instanceof Error ? error.message : String(error) },
        });
        return null;
    }
}
