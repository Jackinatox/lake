import { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';

// Config
const minBackups = 2;
const maxBackups = 100;
const minDisk = 10240; // 10GiB in MiB
const maxDisk = 102400; // 100GiB in MiB

// Input CPU % - 1 Thread = 100 | RamSize in MiB | return MiB
/**
 * Calculates the disk size based on the provided CPU and RAM size.
 * The calculation is performed using the formula: `(cpu / 50 + ramSize / 512) * 1024`,
 * with the result being constrained between `minDisk` and `maxDisk` values.
 *
 * @param cpu - The number of CPU in %.
 * @param ramSize - The size of RAM in MiB (mebibytes).
 * @returns The calculated disk size in MiB, constrained by the minimum and maximum disk size limits.
 */
export function calcDiskSize(cpu: number, ramSize: number): number {
    // Calculates Disk like this: threads*2 + ramGiB*2 min and Max Values set
    return 81_920;

    return Math.max(
        Math.min(maxDisk, Math.ceil(cpu / 50 + ramSize / 512) * 1024), // threads*2 + ramGiB*2;
        minDisk,
    );
}

/**
 * Calculates the number of backups based on CPU cores and RAM size.
 *
 * The formula used is: `cores + (RAM in GiB * 0.8)`, with the result
 * constrained between `minBackups` and `maxBackups`.
 *
 * @param cpu - The number of CPU in %.
 * @param ramSize - The size of RAM in mebibytes (MiB).
 * @returns The calculated number of backups, constrained by minimum and maximum values.
 */
export function calcBackups(cpu: number, ramSize: number): number {
    // Calculates Backups like this: cores + RamGiB * 0.8 min and max Values set
    return 10;
    return Math.max(
        Math.min(maxBackups, Math.ceil(cpu / 100 + (ramSize / 1024) * 0.8)),
        minBackups,
    );
}

export function getEggId(gameName: string): number {
    switch (gameName.toLowerCase()) {
        case 'minecraft':
            return 5;
        // case 'satisfactory':
        //     return 2;
        // case 'terraria':
        //     return 3;
        // case 'ark':
        //     return 4;
        default:
            return -1;
    }
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    const base = 1024;

    const unitIndex = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
    const clampedIndex = Math.min(unitIndex, units.length - 1);

    const value = bytes / Math.pow(base, clampedIndex);

    const formatted = parseFloat(value.toFixed(1));

    return `${formatted} ${units[clampedIndex]}`;
}

/**
 * Converts megabytes (MB as mebibytes) to gibibytes (GiB) and formats as a string.
 * 
 * @param mb - The value in megabytes (mebibytes).
 * @param decimals - Number of decimal places (default: 0).
 * @returns Formatted string with GiB unit.
 */
export function formatMBToGiB(mb: number, decimals: number = 0): string {
    const gib = mb / 1024;
    return `${gib.toFixed(decimals)} GiB`;
}

/**
 * Converts megabytes to formatted string with appropriate binary unit (MiB or GiB).
 * 
 * @param mb - The value in megabytes (mebibytes).
 * @returns Formatted string with MiB or GiB unit.
 */
export function formatMB(mb: number): string {
    if (mb < 1024) {
        return `${mb} MiB`;
    }
    return formatMBToGiB(mb, mb >= 10240 ? 0 : 1);
}

/**
 * Formats a value already in GiB with appropriate unit (MiB or GiB).
 * 
 * @param gib - The value in gibibytes.
 * @returns Formatted string with MiB or GiB unit.
 */
export function formatGiBValue(gib: number): string {
    if (gib >= 1) {
        return `${gib.toFixed(1)} GiB`;
    }
    return `${(gib * 1024).toFixed(0)} MiB`;
}
