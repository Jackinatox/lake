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
  return Math.max(
    Math.min(
        maxDisk,
        Math.ceil(cpu / 50 + ramSize / 512) * 1024), // threads*2 + ramGiB*2;
      minDisk
  );
}

/**
 * Calculates the number of backups based on CPU cores and RAM size.
 *
 * The formula used is: `cores + (RAM in GB * 0.8)`, with the result
 * constrained between `minBackups` and `maxBackups`.
 *
 * @param cpu - The number of CPU in %.
 * @param ramSize - The size of RAM in megabytes.
 * @returns The calculated number of backups, constrained by minimum and maximum values.
 */
export function calcBackups(cpu: number, ramSize: number): number {
  // Calculates Backups like this: cores + RamGB * 0.8 min and max Values set
  return Math.max(
    Math.min(maxBackups, Math.ceil(cpu / 100 + (ramSize / 1024) * 0.8)),
    minBackups
  );
}

export function getEggId(gameName: string): number {
  switch (gameName.toLowerCase()) {
    case "minecraft":
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
