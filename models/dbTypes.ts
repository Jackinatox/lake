export type LocationSettings = {
    id?: string;
    Name?: string;
    CPUPrice?: number; // ca. 1...2
    RAMPrice?: number; // ca. 1...2
    DiskPrice?: bigint;
    PortsLimit?: bigint; // 1...5
    BackupsLimit?: bigint;
}
