import { PaperEggId } from '@/app/GlobalConstants';
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
import { ConfigContainer } from '../shared/config-container';
import { ConfigSettingItem } from '../shared/config-setting-item';

export interface GameConfigProps {
    game: Game;
    onSubmit: (config: GameConfig) => void;
    initialConfig?: GameConfig | null;
}

export const MinecraftConfigComponent = forwardRef(function MinecraftConfig(
    { game, onSubmit, initialConfig }: GameConfigProps,
    ref,
) {
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
    }, [selectedEggId, flavors, selectedVersion?.version]);

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

    // Restore from initialConfig when returning from checkout
    useEffect(() => {
        if (!initialConfig) return;
        const saved = initialConfig.gameSpecificConfig as MinecraftConfig;
        if (saved) {
            setConfig(saved);
        }
        if (initialConfig.eggId) {
            setSelectedFlavorId(initialConfig.eggId);
        }
        // Version will be restored once the flavor's versions are loaded
    }, [initialConfig]);

    // Restore version when gameVersions are loaded and initialConfig is present
    useEffect(() => {
        if (!initialConfig?.version || gameVersions.length === 0) return;
        const matchingVersion = gameVersions.find((v) => v.version === initialConfig.version);
        if (matchingVersion) {
            setSelectedVersion(matchingVersion);
        }
    }, [gameVersions, initialConfig]);

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
        <ConfigContainer>
            {/* Game Flavor Selection */}
            <ConfigSettingItem
                id="flavor"
                label="Game Flavor"
                description="Choose the server software (Paper, Vanilla, etc.)"
            >
                <Select
                    value={selectedEggId?.toString() ?? ''}
                    onValueChange={(value) => setSelectedFlavorId(Number(value))}
                    disabled={flavors.length === 0}
                >
                    <SelectTrigger className="w-40 md:w-48">
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
            </ConfigSettingItem>

            {/* Game Version Selection */}
            <ConfigSettingItem
                id="version"
                label="Game Version"
                description="Select the Minecraft version to run"
            >
                <Select
                    disabled={gameVersions.length === 0}
                    value={selectedVersion?.version}
                    onValueChange={(value) =>
                        setSelectedVersion(gameVersions.find((v) => v.version === value) || null)
                    }
                >
                    <SelectTrigger className="w-40 md:w-48">
                        <SelectValue placeholder="Select version" />
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
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </ConfigSettingItem>
        </ConfigContainer>
    );
});
