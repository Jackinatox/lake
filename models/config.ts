import { FactorioConfig } from './gameSpecificConfig/FactorioConfig';
import { HytaleConfig } from './gameSpecificConfig/HytaleConfig';
import { MinecraftConfig } from './gameSpecificConfig/MinecraftConfig';
import { SatisfactoryConfig } from './gameSpecificConfig/SatisfactoryConfig';

export interface Game {
    id: number;
    slug: string;
    name: string;
    data: any;
}

export interface HardwareConfig {
    pfGroupId: number;
    cpuPercent: number;
    ramMb: number;
    diskMb: number;
    backupCount: number;
    allocations: number;
    durationsDays: number;
}

export interface GameConfig {
    gameSlug: string;
    gameId?: number; // @deprecated — kept for backward compat with existing orders
    eggId: number;
    version: string;
    dockerImage: string;
    gameSpecificConfig: SatisfactoryConfig | MinecraftConfig | FactorioConfig | HytaleConfig;
}

export type ServerConfig = {
    hardwareConfig: HardwareConfig;
    gameConfig: GameConfig;
};
