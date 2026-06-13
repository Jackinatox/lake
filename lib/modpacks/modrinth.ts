import type { ModpackSummary, ModpackVersion } from '@/types/modpacks';
import type { ModpackProvider } from './provider';

const MODRINTH_API_URL = 'https://api.modrinth.com/v2';
const USER_AGENT = 'scyed.com (https://scyed.com)';
const SEARCH_LIMIT = 20;
const VERSIONS_LIMIT = 50;

interface ModrinthSearchHit {
    project_id: string;
    slug: string;
    title: string;
    description: string;
    icon_url: string | null;
    downloads: number;
}

interface ModrinthSearchResponse {
    hits: ModrinthSearchHit[];
}

interface ModrinthVersion {
    id: string;
    name: string;
    version_number: string;
    game_versions: string[];
    loaders: string[];
    date_published: string;
}

async function modrinthFetch(path: string): Promise<unknown> {
    const response = await fetch(`${MODRINTH_API_URL}${path}`, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 300 },
    });

    if (!response.ok) {
        throw new Error(`Modrinth API request failed with status ${response.status} (${path})`);
    }

    return response.json();
}

export const modrinthProvider: ModpackProvider = {
    async search(query: string): Promise<ModpackSummary[]> {
        const params = new URLSearchParams({
            facets: JSON.stringify([['project_type:modpack']]),
            limit: String(SEARCH_LIMIT),
        });
        if (query) {
            params.set('query', query);
        } else {
            params.set('index', 'downloads');
        }

        const data = (await modrinthFetch(`/search?${params}`)) as ModrinthSearchResponse;

        return data.hits.map((hit) => ({
            platform: 'modrinth' as const,
            projectId: hit.project_id,
            slug: hit.slug,
            name: hit.title,
            description: hit.description,
            iconUrl: hit.icon_url || null,
            downloads: hit.downloads,
        }));
    },

    async getVersions(projectId: string): Promise<ModpackVersion[]> {
        const versions = (await modrinthFetch(
            `/project/${encodeURIComponent(projectId)}/version`,
        )) as ModrinthVersion[];

        return versions.slice(0, VERSIONS_LIMIT).map((version) => ({
            versionId: version.id,
            name: version.name,
            versionNumber: version.version_number,
            gameVersion: version.game_versions[0] ?? null,
            loaders: version.loaders,
            datePublished: version.date_published,
        }));
    },
};
