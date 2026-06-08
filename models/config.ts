import z from 'zod';
import { FactorioConfig } from './gameSpecificConfig/FactorioConfig';
import { HytaleConfig } from './gameSpecificConfig/HytaleConfig';
import { MinecraftConfig } from './gameSpecificConfig/MinecraftConfig';
import { SatisfactoryConfig } from './gameSpecificConfig/SatisfactoryConfig';
import { ValheimConfig } from './gameSpecificConfig/ValheimConfig';
import type { ResourceTierDisplay } from './prisma';
import { gameConfigSchema } from '@/lib/validation/order';

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

export type GameConfig = z.infer<typeof gameConfigSchema>;

// export interface GameConfig {
//     gameSlug: string;
//     eggId: number;
//     version: string;
//     dockerImage: string;
//     gameSpecificConfig: SatisfactoryConfig | MinecraftConfig | FactorioConfig | HytaleConfig | ValheimConfig;
// }

export type ServerConfig = {
    hardwareConfig: HardwareConfig;
    gameConfig: GameConfig;
};
