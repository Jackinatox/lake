"use client"

import React, { useEffect, useState } from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { usePTEnv } from '@/hooks/usePTEnv'
import type { GameVersion } from "@/types/gameData"

interface DockerImageSelectorProps {
    serverIdentifier: string
    apiKey?: string
    availableVersions: GameVersion[]
    disabled?: boolean
}

function DockerImageSelector({ serverIdentifier, apiKey, availableVersions, disabled = false }: DockerImageSelectorProps) {
    const { value: dockerValue, error: dockerError, loading: dockerLoading, setValue: setDockerValue } = usePTEnv("DOCKER_IMAGE", serverIdentifier, apiKey);
    
    const [selectedDockerImage, setSelectedDockerImage] = useState<string>("");
    const [isDockerUpdating, setIsDockerUpdating] = useState(false);
    const [initialDockerImage, setInitialDockerImage] = useState<string>("");
    const [lastSavedDockerImage, setLastSavedDockerImage] = useState<string>("");
    const [dockerUpdateError, setDockerUpdateError] = useState<string>("");

    useEffect(() => {
        if (dockerValue && !dockerLoading) {
            setSelectedDockerImage(dockerValue);
            setLastSavedDockerImage(dockerValue);
            // Set initial docker image only once when first loaded
            if (!initialDockerImage) {
                setInitialDockerImage(dockerValue);
            }
        }
    }, [dockerValue, dockerLoading, initialDockerImage]);

    const handleDockerImageChange = async (dockerImage: string) => {
        // Docker images cannot be updated like environment variables
        // This is a placeholder for future implementation
        setSelectedDockerImage(dockerImage);
    };

    // Get unique docker images from available versions
    const getUniqueDockerImages = () => {
        const dockerImages = availableVersions.map(version => version.docker_image);
        return Array.from(new Set(dockerImages));
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Docker Image</Label>
                {isDockerUpdating && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {!isDockerUpdating && !dockerUpdateError && selectedDockerImage === lastSavedDockerImage && selectedDockerImage && selectedDockerImage !== initialDockerImage && (
                    <div className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-xs font-medium">Saved</span>
                    </div>
                )}
                {!isDockerUpdating && dockerUpdateError && (
                    <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Failed</span>
                    </div>
                )}
            </div>
            <Select
                value={selectedDockerImage}
                onValueChange={handleDockerImageChange}
                disabled={dockerLoading || disabled || availableVersions.length === 0 || isDockerUpdating}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a docker image" />
                </SelectTrigger>
                <SelectContent className="w-full">
                    <SelectGroup>
                        {getUniqueDockerImages().map((dockerImage) => (
                            <SelectItem key={dockerImage} value={dockerImage}>
                                {dockerImage}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            {dockerError && (
                <p className="text-sm text-red-500">Error: {JSON.stringify(dockerError)}</p>
            )}
            {dockerUpdateError && (
                <p className="text-sm text-red-500">{dockerUpdateError}</p>
            )}
        </div>
    )
}

export default DockerImageSelector