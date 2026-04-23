import { FactorioConfig } from './gameSpecificConfig/FactorioConfig';
import { HytaleConfig } from './gameSpecificConfig/HytaleConfig';
import { MinecraftConfig } from './gameSpecificConfig/MinecraftConfig';
import { SatisfactoryConfig } from './gameSpecificConfig/SatisfactoryConfig';
import type { ResourceTierDisplay } from './prisma';

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

export type UpgradeBaseConfig = HardwareConfig & {
    resourceTierId: number | null;
    currentDiskUsageMb: number;
    resourceTier: ResourceTierDisplay | null;
};

export interface GameConfig {
    gameSlug: string;
    eggId: number;
    version: string;
    dockerImage: string;
    gameSpecificConfig: SatisfactoryConfig | MinecraftConfig | FactorioConfig | HytaleConfig;
}

export type ServerConfig = {
    hardwareConfig: HardwareConfig;
    gameConfig: GameConfig;
};
