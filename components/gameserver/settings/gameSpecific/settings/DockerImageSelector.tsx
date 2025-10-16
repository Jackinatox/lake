"use client"

import React, { useEffect, useState } from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { env } from 'next-runtime-env';
import { Loader2, Save } from "lucide-react"
import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'
import { changeServerStartup } from '../../serverSettingsActions'

interface DockerImageSelectorProps {
    serverIdentifier: string
    apiKey?: string
    disabled?: boolean
    ptSelectedDockerImage: string
    title: string
}

function DockerImageSelector({ serverIdentifier, apiKey, disabled = false, title, ptSelectedDockerImage }: DockerImageSelectorProps) {
    const [dockerImages, setDockerImages] = useState<PterodactylDockerImage>({});
    const [selectedDockerImage, setSelectedDockerImage] = useState<string>(ptSelectedDockerImage || "");
    const [savedDockerImage, setSavedDockerImage] = useState<string>(ptSelectedDockerImage || "");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>("");

    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');

    useEffect(() => {
        const fetchDockerImages = async () => {
            if (!serverIdentifier || !apiKey || !ptUrl) return;

            setLoading(true);
            setError("");

            try {
                const url = `${ptUrl}/api/client/servers/${serverIdentifier}/startup`;
                const res = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`,
                    },
                });

                if (!res.ok) {
                    throw new Error(`Failed to fetch startup data: ${res.status} ${res.statusText}`);
                }

                const data: PterodactylStartupResponse = await res.json();

                if (data.meta && data.meta.docker_images) {
                    // Sort docker images by name with trailing-number-aware sort
                    const sortedEntries = Object.entries(data.meta.docker_images).sort(([a], [b]) => {
                        const numA = extractTrailingNumber(a);
                        const numB = extractTrailingNumber(b);

                        let comparison: number;

                        if (numA !== null && numB !== null) {
                            comparison = numA - numB;
                        } else if (numA !== null) {
                            comparison = -1;
                        } else if (numB !== null) {
                            comparison = 1;
                        } else {
                            comparison = a.localeCompare(b, undefined, { sensitivity: 'base' }); // fallback
                        }

                        return -comparison;
                    });

                    const sortedDockerImages: PterodactylDockerImage = {};
                    for (const [name, image] of sortedEntries) {
                        sortedDockerImages[name] = image;
                    }
                    setDockerImages(sortedDockerImages);

                    // Set first docker image as default if none selected
                    const imageKeys = Object.keys(sortedDockerImages);
                    if (imageKeys.length > 0 && !selectedDockerImage) {
                        setSelectedDockerImage(sortedDockerImages[imageKeys[0]]);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch docker images");
            } finally {
                setLoading(false);
            }
        };

        fetchDockerImages();
    }, [serverIdentifier, apiKey, ptUrl]);

    function extractTrailingNumber(str: string): number | null {
        const match = str.match(/(\d+)$/); // digits at the end of string
        return match ? parseInt(match[1], 10) : null;
    }

    const handleDockerImageChange = async (dockerImage: string) => {
        setSaving(true);
        try {
            await changeServerStartup(serverIdentifier, dockerImage);
            setSavedDockerImage(dockerImage);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save docker image");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{title}</Label>
                <span className="text-xs text-muted-foreground italic">(Restart required)</span>
                {(loading || saving) && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
            </div>
            <ButtonGroup className="w-full">
                <Select
                    value={selectedDockerImage}
                    onValueChange={setSelectedDockerImage}
                    disabled={loading || disabled || Object.keys(dockerImages).length === 0}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a docker image" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                        <SelectGroup>
                            {Object.entries(dockerImages).map(([name, image]) => (
                                <SelectItem key={image} value={image}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Button className="gap-2"
                    variant="outline"
                    disabled={selectedDockerImage === savedDockerImage || !selectedDockerImage || saving}
                    onClick={() => handleDockerImageChange(selectedDockerImage)}>
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                </Button>
            </ButtonGroup>
            {error && (
                <p className="text-sm text-red-500">Error: {error}</p>
            )}
        </div>
    )
}

export default DockerImageSelector


interface PterodactylDockerImage {
    [name: string]: string; // e.g., "Java 21": "ghcr.io/pterodactyl/yolks:java_21"
}

interface PterodactylStartupResponse {
    object: string;
    data: Array<{
        object: string;
        attributes: {
            name: string;
            description: string;
            env_variable: string;
            default_value: string;
            server_value: string;
            is_editable: boolean;
            rules: string;
        };
    }>;
    meta: {
        startup_command: string;
        docker_images: PterodactylDockerImage;
        raw_startup_command: string;
    };
}