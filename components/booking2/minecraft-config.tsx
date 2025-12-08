import { PaperEggId } from '@/app/GlobalConstants';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Game, GameConfig } from '@/models/config';
import { MinecraftConfig } from '@/models/gameSpecificConfig/MinecraftConfig';
import { GameFlavor, GameVersion } from '@/types/gameData';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';

interface MinecraftConfigProps {
    game: Game;
    additionalConfig?: Record<string, any>;
    onAdditionalConfigChange?: (config: Record<string, any>) => void;
    onSubmit: (config: GameConfig) => void;
}

export const MinecraftConfigComponent = forwardRef(
    ({ game: givenGame, onSubmit }: MinecraftConfigProps, ref) => {
        const t = useTranslations('buyGameServer.gameConfig');
        const [selectedEggId, setSelectedFlavorId] = useState<number | null>(null);
        const [selectedVersion, setSelectedVersion] = useState<GameVersion | null>(null);
        const [gameVersions, setGameVersions] = useState<GameVersion[]>([]);
        const [versionOpen, setVersionOpen] = useState(false);

        const flavors = useMemo(() => (givenGame.data.flavors as GameFlavor[]) ?? [], [givenGame]);

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
                    gameId: givenGame.id,
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
                            <CardTitle className="text-lg sm:text-xl">
                                {t('title', { game: givenGame.name || 'Game' })}
                            </CardTitle>
                            <CardDescription className="text-sm">
                                {t('description')}
                            </CardDescription>
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
                    <Popover open={versionOpen} onOpenChange={setVersionOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={versionOpen}
                                className="w-full justify-between text-left"
                                disabled={gameVersions.length === 0}
                            >
                                <span className="truncate">
                                    {selectedVersion?.version || 'Select a version'}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            align="start"
                        >
                            <Command>
                                <CommandInput placeholder="Search version..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No version found.</CommandEmpty>
                                    <CommandGroup>
                                        {gameVersions.slice().map((version) => (
                                            <CommandItem
                                                key={version.version}
                                                value={version.version}
                                                onSelect={() => {
                                                    setSelectedVersion(version);
                                                    setVersionOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        selectedVersion?.version === version.version
                                                            ? 'opacity-100'
                                                            : 'opacity-0',
                                                    )}
                                                />
                                                <span className="truncate">{version.version}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        );
    },
);
