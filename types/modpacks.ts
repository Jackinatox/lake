// Shared shapes for the modpack integration (Modrinth today, CurseForge later).
// To add a platform: extend MODPACK_PLATFORMS, add a provider in lib/modpacks/
// and an entry in GameData.data.modpackPlatforms.
export const MODPACK_PLATFORMS = ['modrinth'] as const;
export type ModpackPlatform = (typeof MODPACK_PLATFORMS)[number];

export interface ModpackSummary {
    platform: ModpackPlatform;
    projectId: string;
    slug: string;
    name: string;
    description: string;
    iconUrl: string | null;
    downloads: number;
}

export interface ModpackVersion {
    versionId: string;
    name: string;
    versionNumber: string;
    gameVersion: string | null; // Minecraft version the pack runs on
    loaders: string[]; // e.g. ['forge'], ['fabric'], ['neoforge']
    datePublished: string;
}
