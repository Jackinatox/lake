'use client';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { GameFlavor, ModpackDockerImage } from '@/types/gameData';
import type { ModpackPlatform, ModpackSummary, ModpackVersion } from '@/types/modpacks';
import { useEffect, useState } from 'react';

export interface ModpackSelection {
    platform: ModpackPlatform;
    projectId: string;
    versionId: string;
    name: string;
    gameVersion: string;
    dockerImage: string;
}

interface ModpackPickerProps {
    platform: ModpackPlatform;
    dockerImages: ModpackDockerImage[];
    flavors: GameFlavor[]; // fallback when the egg has no dockerImages configured
    value: ModpackSelection | null;
    onChange: (selection: ModpackSelection | null) => void;
}

const downloadsFormat = new Intl.NumberFormat('en', { notation: 'compact' });

// Compare dotted-numeric MC versions so 1.20.10 > 1.20.2. Returns null when either
// side isn't a clean release version (e.g. a snapshot like "24w14a").
function compareMcVersions(a: string, b: string): number | null {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    if (pa.some(Number.isNaN) || pb.some(Number.isNaN)) return null;
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

// Pick the egg's image whose minMcVersion is the highest one still <= the pack's MC
// version. Snapshots/unparseable -> newest Java; older than all breakpoints -> oldest.
function resolveModpackDockerImage(images: ModpackDockerImage[], mcVersion: string): string | null {
    if (images.length === 0) return null;
    const sorted = [...images].sort(
        (x, y) => compareMcVersions(y.minMcVersion, x.minMcVersion) ?? 0,
    );
    for (const img of sorted) {
        const cmp = compareMcVersions(mcVersion, img.minMcVersion);
        if (cmp === null) return sorted[0].image;
        if (cmp >= 0) return img.image;
    }
    return sorted[sorted.length - 1].image;
}

// Older fallback: borrow the docker image of the matching flavor version.
function resolveFlavorDockerImage(flavors: GameFlavor[], mcVersion: string): string | null {
    for (const flavor of flavors) {
        const match = flavor.versions.find((v) => v.version === mcVersion);
        if (match) return match.docker_image;
    }
    return flavors[0]?.versions[0]?.docker_image ?? null;
}

// Modpack versions reference an MC version, not an egg/docker image. Prefer the
// modpack egg's own images (they may carry egg-specific deps), fall back to flavors.
function resolveDockerImage(
    images: ModpackDockerImage[],
    flavors: GameFlavor[],
    mcVersion: string,
): string | null {
    return (
        resolveModpackDockerImage(images, mcVersion) ?? resolveFlavorDockerImage(flavors, mcVersion)
    );
}

export function ModpackPicker({
    platform,
    dockerImages,
    flavors,
    value,
    onChange,
}: ModpackPickerProps) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 400);
    const [results, setResults] = useState<ModpackSummary[]>([]);
    const [searchLoading, setSearchLoading] = useState(true);
    const [searchError, setSearchError] = useState(false);

    // Restore a previous selection (e.g. returning from checkout) as a minimal summary
    const [selectedPack, setSelectedPack] = useState<ModpackSummary | null>(() =>
        value
            ? {
                  platform: value.platform,
                  projectId: value.projectId,
                  slug: '',
                  name: value.name,
                  description: '',
                  iconUrl: null,
                  downloads: 0,
              }
            : null,
    );
    const [versions, setVersions] = useState<ModpackVersion[]>([]);
    // projectId the loaded `versions` belong to, so we know when they are stale
    const [versionsProjectId, setVersionsProjectId] = useState<string | null>(null);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [versionsError, setVersionsError] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
        value?.versionId ?? null,
    );

    useEffect(() => {
        let cancelled = false;
        setSearchLoading(true);
        setSearchError(false);
        fetch(
            `/api/modpacks/search?platform=${platform}&query=${encodeURIComponent(debouncedQuery)}`,
        )
            .then((res) => {
                if (!res.ok) throw new Error('Search failed');
                return res.json();
            })
            .then((data: { modpacks: ModpackSummary[] }) => {
                if (cancelled) return;
                setResults(data.modpacks);
            })
            .catch(() => {
                if (cancelled) return;
                setResults([]);
                setSearchError(true);
            })
            .finally(() => {
                if (!cancelled) setSearchLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [debouncedQuery, platform]);

    const selectedProjectId = selectedPack?.projectId ?? null;

    useEffect(() => {
        if (!selectedProjectId) {
            setVersions([]);
            setVersionsProjectId(null);
            return;
        }
        let cancelled = false;
        setVersionsLoading(true);
        setVersionsError(false);
        fetch(`/api/modpacks/${selectedProjectId}/versions?platform=${platform}`)
            .then((res) => {
                if (!res.ok) throw new Error('Versions failed');
                return res.json();
            })
            .then((data: { versions: ModpackVersion[] }) => {
                if (cancelled) return;
                const usable = data.versions.filter((v) => v.gameVersion !== null);
                setVersions(usable);
                setVersionsProjectId(selectedProjectId);
                setSelectedVersionId((prev) =>
                    usable.some((v) => v.versionId === prev)
                        ? prev
                        : (usable[0]?.versionId ?? null),
                );
            })
            .catch(() => {
                if (cancelled) return;
                setVersionsError(true);
            })
            .finally(() => {
                if (!cancelled) setVersionsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedProjectId, platform]);

    // Emit the full selection once pack + version are chosen, null when incomplete
    useEffect(() => {
        if (selectedPack && versionsProjectId === selectedPack.projectId) {
            const version = versions.find((v) => v.versionId === selectedVersionId);
            if (version?.gameVersion) {
                const dockerImage = resolveDockerImage(dockerImages, flavors, version.gameVersion);
                if (dockerImage) {
                    if (
                        value?.projectId !== selectedPack.projectId ||
                        value.versionId !== version.versionId
                    ) {
                        onChange({
                            platform,
                            projectId: selectedPack.projectId,
                            versionId: version.versionId,
                            name: selectedPack.name,
                            gameVersion: version.gameVersion,
                            dockerImage,
                        });
                    }
                    return;
                }
            }
        } else if (selectedPack && value?.projectId === selectedPack.projectId) {
            // Versions for a restored selection are still loading; keep the value
            return;
        }
        if (value) onChange(null);
    }, [
        selectedPack,
        versions,
        versionsProjectId,
        selectedVersionId,
        dockerImages,
        flavors,
        platform,
        value,
        onChange,
    ]);

    const handleSelectPack = (pack: ModpackSummary) => {
        if (pack.projectId === selectedPack?.projectId) return;
        setSelectedPack(pack);
        setSelectedVersionId(null);
        setVersions([]);
        setVersionsProjectId(null);
    };

    return (
        <div className="space-y-3">
            <Input
                type="search"
                placeholder="Search modpacks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            <ScrollArea className="h-72 border rounded-lg">
                {searchLoading ? (
                    <div className="space-y-1 p-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-2">
                                <Skeleton className="h-10 w-10 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : searchError ? (
                    <p className="p-4 text-sm text-muted-foreground">
                        Failed to load modpacks. Please try again.
                    </p>
                ) : results.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">No modpacks found</p>
                ) : (
                    <div className="space-y-1 p-2">
                        {results.map((pack) => (
                            <button
                                key={pack.projectId}
                                type="button"
                                onClick={() => handleSelectPack(pack)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent',
                                    pack.projectId === selectedPack?.projectId && 'bg-accent',
                                )}
                            >
                                {pack.iconUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={pack.iconUrl}
                                        alt=""
                                        className="h-10 w-10 shrink-0 rounded-md object-cover bg-muted"
                                    />
                                ) : (
                                    <div className="h-10 w-10 shrink-0 rounded-md bg-muted" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{pack.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {pack.description}
                                    </p>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {downloadsFormat.format(pack.downloads)} downloads
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {selectedPack && (
                <div className="flex flex-row items-center justify-between gap-3 p-3 md:p-4 border rounded-lg">
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate">{selectedPack.name}</p>
                        <p className="text-xs text-muted-foreground">Choose the modpack version</p>
                    </div>
                    <div className="shrink-0">
                        {versionsLoading ? (
                            <Spinner />
                        ) : versionsError ? (
                            <p className="text-xs text-muted-foreground">Failed to load versions</p>
                        ) : versions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No versions available</p>
                        ) : (
                            <Select
                                value={selectedVersionId ?? ''}
                                onValueChange={(v) => setSelectedVersionId(v)}
                            >
                                <SelectTrigger className="w-48 md:w-64">
                                    <SelectValue placeholder="Select version" />
                                </SelectTrigger>
                                <SelectContent>
                                    {versions.map((version) => (
                                        <SelectItem
                                            key={version.versionId}
                                            value={version.versionId}
                                        >
                                            <span className="truncate">
                                                {version.name} (MC {version.gameVersion})
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground">Modpacks usually need 4 GB RAM or more.</p>
        </div>
    );
}
