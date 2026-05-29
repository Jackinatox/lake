'use client';

import { GameServer } from '@/models/gameServerModel';
import React, { useEffect, useState } from 'react';
import { MinecraftFlavorDialog } from './MinecraftFlavorDialog';
import DockerImageSelector from './DockerImageSelector';
import { usePTEnv } from '@/hooks/usePTEnv';
import { fetchGames } from '@/lib/actions';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Save } from 'lucide-react';
import type { GameFlavor, GameVersion } from '@/types/gameData';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import StartupCommand from '../../StartupCommand';

interface MinecraftSettingsProps {
    server: GameServer;
    apiKey: string;
}

function MinecraftSettings({ server, apiKey }: MinecraftSettingsProps) {
    return (
        <div className="space-y-4">
            <StartupCommand
                command={server.invocation}
                ptServerId={server.identifier}
                defaultCommand={server.defaultStartCommand}
            />

            <MinecraftVersionSelector
                gameSlug={server.gameSlug}
                eggId={server.gameConfig.eggId}
                serverIdentifier={server.identifier}
                apiKey={apiKey}
            />

            <DockerImageSelector
                serverIdentifier={server.identifier}
                apiKey={apiKey}
                title="Java Version"
                ptSelectedDockerImage={server.docker_image}
                hint="Du kannst die Java-Version ändern, wenn du willst, aber die ausgewählte sollte funktionieren."
            />

            <div className="flex items-start gap-2">
                <MinecraftFlavorDialog server={server} />
            </div>
        </div>
    );
}

interface MinecraftVersionSelectorProps {
    gameSlug: string;
    eggId: number;
    serverIdentifier: string;
    apiKey: string;
}

function MinecraftVersionSelector({
    gameSlug,
    eggId,
    serverIdentifier,
    apiKey,
}: MinecraftVersionSelectorProps) {
    const { value, error, loading, setValue } = usePTEnv(
        'MINECRAFT_VERSION',
        serverIdentifier,
        apiKey,
    );

    const [availableVersions, setAvailableVersions] = useState<GameVersion[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastSavedVersion, setLastSavedVersion] = useState<string>('');
    const [updateError, setUpdateError] = useState<string>('');

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                setVersionsLoading(true);
                const data = await fetchGames(gameSlug);
                const raw = data?.data || null;
                const flavors: GameFlavor[] = raw?.flavors ?? [];

                const currentFlavor = flavors.find((flavor) => flavor.egg_id === eggId);
                if (currentFlavor) {
                    setAvailableVersions(currentFlavor.versions);
                }
            } catch (error) {
                console.error('Error fetching versions:', error);
            } finally {
                setVersionsLoading(false);
            }
        };
        fetchVersions();
    }, [gameSlug, eggId]);

    useEffect(() => {
        if (value && !loading) {
            setSelectedVersion(value);
            setLastSavedVersion(value);
        }
    }, [value, loading]);

    const handleSave = async (version: string) => {
        setIsUpdating(true);
        setUpdateError('');

        try {
            await setValue(version);
            setLastSavedVersion(version);
        } catch (error) {
            console.error('Error updating version:', error);
            setUpdateError('Failed to update version');
            setSelectedVersion(lastSavedVersion);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Minecraft Version</Label>
                <span className="text-xs text-muted-foreground italic">
                    (Reinstall required)
                </span>
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                {!isUpdating && updateError && (
                    <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Failed</span>
                    </div>
                )}
            </div>
            <ButtonGroup className="w-full">
                <Select
                    value={selectedVersion}
                    onValueChange={setSelectedVersion}
                    disabled={
                        loading ||
                        versionsLoading ||
                        availableVersions.length === 0 ||
                        isUpdating
                    }
                >
                    <SelectTrigger className="flex-1 min-w-0 h-9">
                        <SelectValue placeholder="Select a version" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                        <SelectGroup>
                            {availableVersions.map((version) => (
                                <SelectItem key={version.version} value={version.version}>
                                    {version.version} {version.version === value && '(Current)'}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    disabled={
                        selectedVersion === lastSavedVersion || !selectedVersion || isUpdating
                    }
                    onClick={() => handleSave(selectedVersion)}
                    className="shrink-0 gap-2"
                >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                </Button>
            </ButtonGroup>
            {error && <p className="text-sm text-red-500">Error: {JSON.stringify(error)}</p>}
            {updateError && <p className="text-sm text-red-500">{updateError}</p>}
        </div>
    );
}

export default MinecraftSettings;
