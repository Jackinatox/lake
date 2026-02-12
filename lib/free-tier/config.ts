import {
    FREE_TIER_CPU_PERCENT,
    FREE_TIER_RAM_MB,
    FREE_TIER_STORAGE_MB,
    FREE_TIER_DURATION_DAYS,
    FREE_TIER_MAX_SERVERS,
    FREE_TIER_BACKUP_COUNT,
    FREE_TIER_ALLOCATIONS,
} from '@/app/GlobalConstants';
import prisma from '@/lib/prisma';

import { unstable_cache } from 'next/cache';

export interface FreeTierConfig {
    cpu: number;
    ram: number;
    storage: number;
    backupCount: number;
    allocations: number;
    duration: number;
    maxServers: number;
}

const keys = [
    FREE_TIER_CPU_PERCENT,
    FREE_TIER_RAM_MB,
    FREE_TIER_STORAGE_MB,
    FREE_TIER_DURATION_DAYS,
    FREE_TIER_MAX_SERVERS,
    FREE_TIER_BACKUP_COUNT,
    FREE_TIER_ALLOCATIONS,
];

/**
 * Fetches the free tier configuration from the database
 * Returns default values if database values are not available
 */
export async function getFreeTierConfigCached(): Promise<FreeTierConfig> {
    const chachedData = unstable_cache(getFreeTierConfig, [], {
        revalidate: 300,
        tags: ['keyValue'],
    });
    return chachedData();
}

export async function getFreeTierConfig(): Promise<FreeTierConfig> {
    const data = await prisma.keyValue.findMany({
        where: {
            key: { in: keys },
        },
    });

    const getKeyValueNumber = (key: string) => {
        const entry = data.find((i) => i.key === key);
        return entry?.number || 0;
    };

    const [cpu, ram, storage, duration, maxServers, backupCount, allocations] = await Promise.all([
        getKeyValueNumber(FREE_TIER_CPU_PERCENT),
        getKeyValueNumber(FREE_TIER_RAM_MB),
        getKeyValueNumber(FREE_TIER_STORAGE_MB),
        getKeyValueNumber(FREE_TIER_DURATION_DAYS),
        getKeyValueNumber(FREE_TIER_MAX_SERVERS),
        getKeyValueNumber(FREE_TIER_BACKUP_COUNT),
        getKeyValueNumber(FREE_TIER_ALLOCATIONS),
    ]);

    return {
        cpu: cpu,
        ram: ram,
        storage: storage,
        backupCount: backupCount,
        allocations: allocations,
        duration: duration,
        maxServers: maxServers,
    };
}
