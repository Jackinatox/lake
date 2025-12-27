import { PaperEggId } from '@/app/GlobalConstants';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Game, GameConfig } from '@/models/config';
import { MinecraftConfig } from '@/models/gameSpecificConfig/MinecraftConfig';
import { GameFlavor, GameVersion } from '@/types/gameData';
import { SelectGroup } from '@radix-ui/react-select';
import { useTranslations } from 'next-intl';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';

interface MinecraftConfigProps {
    game: Game;
    onSubmit: (config: GameConfig) => void;
}

export const MinecraftConfigComponent = forwardRef(
    ({ game, onSubmit }: MinecraftConfigProps, ref) => {
        const t = useTranslations('buyGameServer.gameConfig');
        const [selectedEggId, setSelectedFlavorId] = useState<number | null>(null);
        const [selectedVersion, setSelectedVersion] = useState<GameVersion | null>(null);
        const [gameVersions, setGameVersions] = useState<GameVersion[]>([]);
        const [versionOpen, setVersionOpen] = useState(false);

        const flavors = useMemo(() => (game.data.flavors as GameFlavor[]) ?? [], [game]);

        useEffect(() => {
            const defaultEggId =
                flavors.find((f) => f.egg_id === PaperEggId)?.egg_id || flavors[0]?.egg_id || null;
            setSelectedFlavorId(defaultEggId);

            // Set default version to the first version of the selected flavor
            if (defaultEggId !== null) {
                const flavor = flavors.find((f) => f.egg_id === defaultEggId);
                if (flavor && flavor.versions.length > 0) {
                    setSelectedVersion(flavor.versions[0]);
                    setGameVersions(flavor.versions);
                }
            }
        }, [flavors]);

        useEffect(() => {
            if (selectedEggId !== null) {
                const flavor = flavors.find((f) => f.egg_id === selectedEggId);
                if (flavor) {
                    setConfig((prevConfig) => ({ ...prevConfig, flavor: flavor.name }));
                    setGameVersions(flavor.versions);
                    const versionStillExists = flavor.versions.some(
                        (v) => v.version === selectedVersion?.version,
                    );

                    if (!versionStillExists) {
                        setSelectedVersion(flavor.versions.length > 0 ? flavor.versions[0] : null);
                    }
                }
            }
        }, [selectedEggId, flavors]);

        const [config, setConfig] = useState<MinecraftConfig>({
            serverName: 'My Minecraft Server',
            maxPlayers: 20,
            viewDistance: 10,
            difficulty: 'normal',
            enablePvp: true,
            enableNether: true,
            enableCommandBlocks: true,
            spawnProtection: 16,
            allowFlight: false,
            flavor: 'Vanilla',
        });

        useImperativeHandle(ref, () => ({
            submit: () => {
                if (selectedEggId === null || !selectedVersion) {
                    console.error('Missing required selection');
                    return;
                }

                // Create a complete game configuration object
                const completeConfig: GameConfig = {
                    gameId: game.id,
                    eggId: selectedEggId,
                    version: selectedVersion.version,
                    dockerImage: selectedVersion.docker_image,
                    gameSpecificConfig: {
                        ...config,
                    },
                };

                // Pass the complete configuration to the parent component
                onSubmit(completeConfig);
            },
        }));

        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                            <CardTitle>
                                {t('description')}
                            </CardTitle>
                        </div>
                    </div>
                </div>

                {/* Game Flavor Selection */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Game Flavor</Label>
                    <Select
                        value={selectedEggId?.toString() ?? ''}
                        onValueChange={(value) => setSelectedFlavorId(Number(value))}
                        disabled={flavors.length === 0}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a flavor" />
                        </SelectTrigger>
                        <SelectContent>
                            {flavors.map((flavor) => (
                                <SelectItem key={flavor.egg_id} value={flavor.egg_id.toString()}>
                                    {flavor.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Game Version Selection */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Game Version</Label>
                    <Select
                        disabled={gameVersions.length === 0}
                        value={selectedVersion?.version}
                        onValueChange={(value) => setSelectedVersion(gameVersions.find((v) => v.version === value) || null)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a fruit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {gameVersions.slice().map((version) => (
                                    <SelectItem
                                        key={version.version}
                                        value={version.version}
                                        onSelect={() => {
                                            setSelectedVersion(version);
                                            setVersionOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >

                                        <span className="truncate">{version.version}</span>
                                    </SelectItem >
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div >

            </div>
        );
    },
);
