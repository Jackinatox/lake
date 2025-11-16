import {
    FREE_TIER_CPU_PERCENT,
    FREE_TIER_RAM_MB,
    FREE_TIER_STORAGE_MB,
    FREE_TIER_DURATION_DAYS,
} from '@/app/GlobalConstants';
import { getKeyValueNumber, getKeyValueString } from '@/lib/keyValue';

export interface FreeTierConfig {
    cpu: number;
    ram: number;
    storage: number;
    duration: number;
}

/**
 * Fetches the free tier configuration from the database
 * Returns default values if database values are not available
 */
export async function getFreeTierConfig(): Promise<FreeTierConfig> {
    const [cpu, ram, storage, duration] = await Promise.all([
        getKeyValueNumber(FREE_TIER_CPU_PERCENT),
        getKeyValueNumber(FREE_TIER_RAM_MB),
        getKeyValueNumber(FREE_TIER_STORAGE_MB),
        getKeyValueNumber(FREE_TIER_DURATION_DAYS),
    ]);

    return {
        cpu: cpu,
        ram: ram,
        storage: storage,
        duration: duration,
    };
}
