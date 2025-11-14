import { MinecraftConfig } from './gameSpecificConfig/MinecraftConfig';
import { SatisfactoryConfig } from './gameSpecificConfig/SatisfactoryConfig';

export interface DiskOption {
    id: number;
    size_gb: number;
    price_per_gb: number;
}

export interface Game {
    id: number;
    name: string;
    data: any;
}

export interface HardwareConfig {
    pfGroupId: number;
    cpuPercent: number;
    ramMb: number;
    diskMb: number;
    durationsDays: number;
}

export interface GameConfig {
    gameId: number;
    gameType: string;
    eggId: number;
    version: string;
    dockerImage: string;
    gameSpecificConfig: SatisfactoryConfig | MinecraftConfig;
}
