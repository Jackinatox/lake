// Config
const minBackups = 2;
const maxBackups = 100; 
const minDisk = 10240;  // 10GiB
const maxDisk = 102400; // 100GiB

export function calcDiskSize(cpu: number, ramSize: number): number {
    return Math.max(Math.min(
            maxDisk, 
            Math.ceil(cpu / 50 + ramSize / 512), // threads*2 + ramGiB*2;
        minDisk)); 

    // Minimal 10Gigabyte
}

export function calcBackups(cpuCores: number, ramSize: number): number {
                                // Threads       //GiB
    return Math.max(Math.min(
        maxBackups,
        Math.ceil(cpuCores + ramSize * 0.8)),
    minBackups);
}