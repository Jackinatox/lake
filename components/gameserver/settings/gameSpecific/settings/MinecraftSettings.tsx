"use client"

import { GameServer } from '@/models/gameServerModel'
import React, { useEffect, useState } from 'react'
import { MinecraftFlavorDialog } from './MinecraftFlavorDialog'
import DockerImageSelector from './DockerImageSelector'
import { usePTEnv } from '@/hooks/usePTEnv'
import { fetchGames } from '@/lib/actions'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Check, Loader2, AlertCircle, Info, Save } from "lucide-react"
import type { GameFlavor, GameVersion } from "@/types/gameData"
import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'
import StartupCommand from '../../StartupCommand'

interface MinecraftSettingsProps {
    server: GameServer
    apiKey?: string
}

function MinecraftSettings({ server, apiKey }: MinecraftSettingsProps) {
    const { value, error, loading, setValue } = usePTEnv("MINECRAFT_VERSION", server.identifier, apiKey);

    const [availableVersions, setAvailableVersions] = useState<GameVersion[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string>("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [initialVersion, setInitialVersion] = useState<string>("");
    const [lastSavedVersion, setLastSavedVersion] = useState<string>("");
    const [updateError, setUpdateError] = useState<string>("");

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                setVersionsLoading(true);
                const data = await fetchGames(server.gameDataId);
                const raw = (data?.data as unknown) as any | null;
                const flavors: GameFlavor[] = raw?.flavors ?? [];

                // Find the current flavor to get its versions
                const currentFlavor = flavors.find((flavor) => flavor.id === server.gameData.flavorId);
                if (currentFlavor) {
                    setAvailableVersions(currentFlavor.versions.reverse());
                }
            } catch (error) {
                console.error("Error fetching versions:", error);
            } finally {
                setVersionsLoading(false);
            }
        };
        fetchVersions();
    }, [server.gameDataId, server.gameData.flavorId]);

    useEffect(() => {
        if (value && !loading) {
            setSelectedVersion(value);
            setLastSavedVersion(value);
            // Set initial version only once when first loaded
            if (!initialVersion) {
                setInitialVersion(value);
            }
        }
    }, [value, loading, initialVersion]);


    const handleVersionChange = async (version: string) => {
        setSelectedVersion(version);
    }

    const handleRemoteVersionChange = async (version: string) => {
        setIsUpdating(true);
        setUpdateError(""); // Clear any previous errors

        try {
            await setValue(version);
            setLastSavedVersion(version);
        } catch (error) {
            console.error("Error updating version:", error);
            setUpdateError("Failed to update version");
            // Revert to last saved version
            setSelectedVersion(lastSavedVersion);
        } finally {
            setIsUpdating(false);
        }
    };



    return (
        <div className="space-y-4">
            <div className="">
                <StartupCommand command={server.invocation} />
                <div className="flex items-center gap-2 pt-4">
                    <Label className="text-sm font-medium">Minecraft Version</Label>
                    <span className="text-xs text-muted-foreground italic">(Reinstall required)</span>

                    {isUpdating && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
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
                        onValueChange={handleVersionChange}
                        disabled={loading || versionsLoading || availableVersions.length === 0 || isUpdating}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a version" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                            <SelectGroup>
                                {availableVersions.map((version) => (
                                    <SelectItem key={version.version} value={version.version}>
                                        {version.version} {version.version === value && "(Current)"}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        disabled={
                            selectedVersion === lastSavedVersion ||
                            !selectedVersion ||
                            isUpdating
                        }
                        onClick={() => handleRemoteVersionChange(selectedVersion)}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                    </Button>
                </ButtonGroup>
                {error && (
                    <p className="text-sm text-red-500">Error: {JSON.stringify(error)}</p>
                )}
                {updateError && (
                    <p className="text-sm text-red-500">{updateError}</p>
                )}
            </div>

            <DockerImageSelector
                serverIdentifier={server.identifier}
                apiKey={apiKey}
                disabled={versionsLoading}
                title='Java Version'
                ptSelectedDockerImage={server.docker_image}
            />
            <span className='text-muted-foreground text-xs'>Du kannst die Java-Version ändern, wenn du willst, aber die ausgewählte sollte funktionieren.</span>

            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                    <span className="font-medium">Note:</span> The server will need to be reinstalled for these changes to take effect. Your world data should be preserved during reinstallation.
                </p>
            </div>
            <MinecraftFlavorDialog eggId={server.egg_id} server={server} />
        </div>
    )
}

export default MinecraftSettings