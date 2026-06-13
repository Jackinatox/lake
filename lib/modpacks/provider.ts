import type { ModpackPlatform, ModpackSummary, ModpackVersion } from '@/types/modpacks';
import { modrinthProvider } from './modrinth';

export interface ModpackProvider {
    search(query: string): Promise<ModpackSummary[]>;
    getVersions(projectId: string): Promise<ModpackVersion[]>;
}

// Add the CurseForge provider here once it exists.
const PROVIDERS: Record<ModpackPlatform, ModpackProvider> = {
    modrinth: modrinthProvider,
};

export function getModpackProvider(platform: ModpackPlatform): ModpackProvider {
    return PROVIDERS[platform];
}
