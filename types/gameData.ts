import type { ModpackPlatform } from './modpacks';

export interface GameVersion {
    version: string;
    docker_image: string;
}

export interface GameFlavor {
    name: string;
    egg_id: number;
    versions: GameVersion[];
}

// One selectable Java image the modpack egg declares, with the lowest Minecraft
// version it applies to. The picker resolves a pack's MC version to the entry
// with the highest minMcVersion that is still <= the pack version.
export interface ModpackDockerImage {
    name: string; // e.g. "Java 21"
    image: string; // docker image the modpack egg supports
    minMcVersion: string; // e.g. "1.20.5"
}

export interface ModpackPlatformConfig {
    egg_id: number;
    // Java images this egg supports. May carry egg-specific deps, so they are
    // owned here rather than borrowed from flavors. Falls back to flavors if empty.
    dockerImages?: ModpackDockerImage[];
}

// Shape of GameData.data for minecraft. modpackPlatforms is managed via seed/admin,
// while flavors come from the external version-sync JSON.
export interface MinecraftGameData {
    flavors: GameFlavor[];
    modpackPlatforms?: Partial<Record<ModpackPlatform, ModpackPlatformConfig>>;
}

export enum GameServerStatus {
    PROVISIONING, // Server created in pt
    ACTIVE, // Server is installed

    PAYMENT_PROCESSING,
    // Errors:
    DOES_NOT_EXIST,
    PAYMENT_FAILED,
    CREATION_FAILED, // Only when pt.createServer fails, not the actual installation
    EXPIRED,
    DELETED,
}
