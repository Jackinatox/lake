// Config
const minBackups = 2;
const maxBackups = 100;
const minDisk = 10240; // 10GiB in MiB
const maxDisk = 102400; // 100GiB in MiB

export function calcDiskSize(cpu: number, ramSize: number): number {
  // Calculates Disk like this: threads*2 + ramGiB*2 min and Max Values set
  return Math.max(
    Math.min(
        maxDisk,
        Math.ceil(cpu / 50 + ramSize / 512) * 1024), // threads*2 + ramGiB*2;
      minDisk
  );
}

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
