'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { generateUsername } from 'unique-username-generator';
import { cn } from '@/lib/utils';
import type { GameConfig } from '@/models/config';
import { ValheimConfig, ValheimModdedConfig } from '@/models/gameSpecificConfig/ValheimConfig';
import { ConfigContainer } from '../shared/config-container';
import { ConfigSettingItem } from '../shared/config-setting-item';
import { AnimatedReveal } from '../shared/animated-reveal';
import { GameConfigProps } from './minecraft-config';

export const ValheimConfigComponent = forwardRef(function ValheimConfigComponent(
    { game, onSubmit, initialConfig }: GameConfigProps,
    ref,
) {
    const t = useTranslations('buyGameServer.gameConfig');
    const tv = useTranslations('buyGameServer.gameConfig.valheim');
    const [config, setConfig] = useState<ValheimConfig>(() => ({
        mode: 'vanilla',
        password: generateUsername('_', 0, 20),
        world_name: 'Dedicated',
        max_players: 10,
        public_server: false,
        enable_crossplay: false,
        backup_count: 4,
        backup_interval: 1800,
        auto_update: true,
        backup_longtime: 43200,
        backup_shorttime: 7200,
        server_name: 'ValheimServer',
    }));

    useEffect(() => {
        if (!initialConfig) return;
        const saved = initialConfig.gameSpecificConfig as ValheimConfig;
        if (saved) setConfig(saved);
    }, [initialConfig]);

    const handleChange = <K extends keyof ValheimConfig>(key: K, value: ValheimConfig[K]) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    // TODO: Modded (BepInEx) access is not supported yet — re-enable when ready.
    // const handleModeToggle = (modded: boolean) => {
    //     if (modded) {
    //         const { mode: _, ...shared } = config;
    //         setConfig({ mode: 'modded', ...shared });
    //     } else {
    //         const { mode: _, modpack: __, ...shared } = config as ValheimModdedConfig;
    //         setConfig({ mode: 'vanilla', ...shared });
    //     }
    // };

    const serverNameError =
        config.server_name.length < 4 ? tv('serverName.error') : null;

    useImperativeHandle(ref, () => ({
        submit: () => {
            const isModded = config.mode === 'modded';
            const flavor = isModded ? game.data.modded : game.data.vanilla;

            const completeConfig: GameConfig = {
                gameSlug: game.slug as 'valheim',
                eggId: flavor.egg_Id,
                version: 'latest',
                dockerImage: flavor.docker_image,
                gameSpecificConfig: { ...config },
            };

            onSubmit(completeConfig);
        },
    }));

    return (
        <ConfigContainer>
            {/* Modded (BepInEx) access is not supported yet — re-enable when ready.
            <ConfigSettingItem
                id="valheimMode"
                label={tv('mode.label')}
                description={tv('mode.description')}
            >
                <Switch
                    id="valheimMode"
                    checked={config.mode === 'modded'}
                    onCheckedChange={handleModeToggle}
                />
            </ConfigSettingItem>

            <AnimatedReveal show={config.mode === 'modded'}>
                <ConfigSettingItem
                    id="modpack"
                    label={tv('modpack.label')}
                    description={tv('modpack.description')}
                >
                    <Input
                        id="modpack"
                        type="text"
                        placeholder="AuthorName-ModName-1.0.0"
                        value={(config as ValheimModdedConfig).modpack ?? ''}
                        onChange={(e) =>
                            setConfig((prev) => ({ ...prev, modpack: e.target.value }))
                        }
                        className="w-48 md:w-64"
                    />
                </ConfigSettingItem>
            </AnimatedReveal>
            */}

            {/* Password */}
            <ConfigSettingItem
                id="password"
                label={tv('password.label')}
                description={tv('password.description')}
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
                label={tv('worldName.label')}
                description={tv('worldName.description')}
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
                label={tv('publicServer.label')}
                description={tv('publicServer.description')}
            >
                <Switch
                    id="publicServer"
                    checked={config.public_server}
                    onCheckedChange={(checked) => handleChange('public_server', checked)}
                />
            </ConfigSettingItem>

            {/* Server Name — only relevant when listed publicly */}
            <AnimatedReveal show={config.public_server}>
                <ConfigSettingItem
                    id="serverName"
                    label={tv('serverName.label')}
                    description={tv('serverName.description')}
                    alignStart
                >
                    <div className="flex flex-col items-end gap-1">
                        <Input
                            id="serverName"
                            type="text"
                            maxLength={20}
                            value={config.server_name}
                            onChange={(e) =>
                                handleChange(
                                    'server_name',
                                    e.target.value.replace(/[^A-Za-z]/g, ''),
                                )
                            }
                            aria-invalid={serverNameError ? true : undefined}
                            className={cn(
                                'w-48 md:w-64',
                                serverNameError &&
                                    'border-destructive focus-visible:ring-destructive',
                            )}
                        />
                        {serverNameError && (
                            <p className="text-xs text-destructive">{serverNameError}</p>
                        )}
                    </div>
                </ConfigSettingItem>
            </AnimatedReveal>

            {/* Crossplay */}
            <ConfigSettingItem
                id="crossplay"
                label={tv('crossplay.label')}
                description={tv('crossplay.description')}
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
                    {tv('advanced')}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 md:space-y-6">
                    <ConfigSettingItem
                        id="maxPlayers"
                        label={tv('maxPlayers.label')}
                        description={tv('maxPlayers.description')}
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
                        id="autoUpdate"
                        label={tv('autoUpdate.label')}
                        description={tv('autoUpdate.description')}
                    >
                        <Switch
                            id="autoUpdate"
                            checked={config.auto_update}
                            onCheckedChange={(checked) => handleChange('auto_update', checked)}
                        />
                    </ConfigSettingItem>
                    <ConfigSettingItem
                        id="backupInterval"
                        label={tv('backupInterval.label')}
                        description={tv('backupInterval.description')}
                    >
                        <Input
                            id="backupInterval"
                            type="number"
                            min={0}
                            max={86400}
                            step={300}
                            value={config.backup_interval}
                            onChange={(e) =>
                                handleChange(
                                    'backup_interval',
                                    Math.max(0, Math.min(86400, Number(e.target.value) || 0)),
                                )
                            }
                            className="w-24 md:w-40"
                        />
                    </ConfigSettingItem>
                    <ConfigSettingItem
                        id="backupCount"
                        label={tv('backupCount.label')}
                        description={tv('backupCount.description')}
                    >
                        <Input
                            id="backupCount"
                            type="number"
                            min={0}
                            max={100}
                            value={config.backup_count}
                            onChange={(e) =>
                                handleChange(
                                    'backup_count',
                                    Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                )
                            }
                            className="w-24 md:w-40"
                        />
                    </ConfigSettingItem>
                </CollapsibleContent>
            </Collapsible>

            <p className="text-sm text-muted-foreground">{t('changeableLater')}</p>
        </ConfigContainer>
    );
});
