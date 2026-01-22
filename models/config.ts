import { FactorioConfig } from './gameSpecificConfig/FactorioConfig';
import { HytaleConfig } from './gameSpecificConfig/HytaleConfig';
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
    eggId: number;
    version: string;
    dockerImage: string;
    gameSpecificConfig: SatisfactoryConfig | MinecraftConfig | FactorioConfig | HytaleConfig;
}
