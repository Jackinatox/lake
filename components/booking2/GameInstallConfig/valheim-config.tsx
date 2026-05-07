'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { GameConfig } from '@/models/config';
import { ValheimConfig } from '@/models/gameSpecificConfig/ValheimConfig';
import { ConfigContainer } from '../shared/config-container';
import { ConfigSettingItem } from '../shared/config-setting-item';
import { GameConfigProps } from './minecraft-config';

export const ValheimConfigComponent = forwardRef(function ValheimConfigComponent(
    { game, onSubmit, initialConfig }: GameConfigProps,
    ref,
) {
    const [config, setConfig] = useState<ValheimConfig>({
        mode: 'vanilla',
        password: 'yggdrasil',
        world_name: 'Dedicated',
        max_players: 10,
        public_server: true,
        enable_crossplay: false,
        backup_interval: 1800,
        backup_count: 4,
        modpack: '',
    });

    useEffect(() => {
        if (!initialConfig) return;
        const saved = initialConfig.gameSpecificConfig as ValheimConfig;
        if (saved) setConfig(saved);
    }, [initialConfig]);

    const handleChange = <K extends keyof ValheimConfig>(key: K, value: ValheimConfig[K]) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    useImperativeHandle(ref, () => ({
        submit: () => {
            const isModded = config.mode === 'modded';
            const flavor = isModded ? game.data.modded : game.data.vanilla;

            const completeConfig: GameConfig = {
                gameSlug: game.slug,
                eggId: flavor.egg_id,
                version: 'latest',
                dockerImage: flavor.docker_image,
                gameSpecificConfig: { ...config },
            };

            onSubmit(completeConfig);
        },
    }));

    return (
        <ConfigContainer>
            {/* Modded / Vanilla toggle */}
            <ConfigSettingItem
                id="valheimMode"
                label="Enable Modded (BepInEx)"
                description="Switch between vanilla and modded server with BepInEx mod support"
            >
                <Switch
                    id="valheimMode"
                    checked={config.mode === 'modded'}
                    onCheckedChange={(checked) => handleChange('mode', checked ? 'modded' : 'vanilla')}
                />
            </ConfigSettingItem>

            {config.mode === 'modded' && (
                <ConfigSettingItem
                    id="modpack"
                    label="ModPack (Thunderstore)"
                    description="Optional dependency string for a Thunderstore modpack (changing this requires a server reinstall)"
                >
                    <Input
                        id="modpack"
                        type="text"
                        placeholder="AuthorName-ModName-1.0.0"
                        value={config.modpack ?? ''}
                        onChange={(e) => handleChange('modpack', e.target.value)}
                        className="w-48 md:w-64"
                    />
                </ConfigSettingItem>
            )}

            {/* Password */}
            <ConfigSettingItem
                id="password"
                label="Server Password"
                description="Password required to join (5–20 characters)"
            >
                <Input
                    id="password"
                    type="text"
                    minLength={5}
                    maxLength={20}
                    value={config.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-48 md:w-64"
                />
            </ConfigSettingItem>

            {/* World Name */}
            <ConfigSettingItem
                id="worldName"
                label="World Name"
                description="Name of the world save to load (max 20 characters)"
            >
                <Input
                    id="worldName"
                    type="text"
                    maxLength={20}
                    value={config.world_name}
                    onChange={(e) => handleChange('world_name', e.target.value)}
                    className="w-48 md:w-64"
                />
            </ConfigSettingItem>

            {/* Public Server */}
            <ConfigSettingItem
                id="publicServer"
                label="Public Server"
                description="List this server in the public server browser"
            >
                <Switch
                    id="publicServer"
                    checked={config.public_server}
                    onCheckedChange={(checked) => handleChange('public_server', checked)}
                />
            </ConfigSettingItem>

            {/* Crossplay */}
            <ConfigSettingItem
                id="crossplay"
                label="Enable Crossplay"
                description="Allow players from other platforms to join"
            >
                <Switch
                    id="crossplay"
                    checked={config.enable_crossplay}
                    onCheckedChange={(checked) => handleChange('enable_crossplay', checked)}
                />
            </ConfigSettingItem>

            {/* Advanced */}
            <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg]:rotate-180">
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                    Advanced
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 md:space-y-6">
                    <ConfigSettingItem
                        id="maxPlayers"
                        label="Max Players"
                        description="Maximum number of concurrent players"
                    >
                        <Input
                            id="maxPlayers"
                            type="number"
                            min={1}
                            max={64}
                            value={config.max_players}
                            onChange={(e) =>
                                handleChange(
                                    'max_players',
                                    Math.max(1, Math.min(64, Number(e.target.value) || 1)),
                                )
                            }
                            className="w-24 md:w-40"
                        />
                    </ConfigSettingItem>
                    <ConfigSettingItem
                        id="backupInterval"
                        label="Backup Interval (seconds)"
                        description="How often the world saves automatically (default: 1800 = 30 min)"
                    >
                        <Input
                            id="backupInterval"
                            type="number"
                            min={0}
                            step={300}
                            value={config.backup_interval}
                            onChange={(e) =>
                                handleChange(
                                    'backup_interval',
                                    Math.max(0, Number(e.target.value) || 0),
                                )
                            }
                            className="w-24 md:w-40"
                        />
                    </ConfigSettingItem>
                    <ConfigSettingItem
                        id="backupCount"
                        label="Backup Count"
                        description="Number of automatic backups to keep"
                    >
                        <Input
                            id="backupCount"
                            type="number"
                            min={0}
                            value={config.backup_count}
                            onChange={(e) =>
                                handleChange(
                                    'backup_count',
                                    Math.max(0, Number(e.target.value) || 0),
                                )
                            }
                            className="w-24 md:w-40"
                        />
                    </ConfigSettingItem>
                </CollapsibleContent>
            </Collapsible>
        </ConfigContainer>
    );
});
