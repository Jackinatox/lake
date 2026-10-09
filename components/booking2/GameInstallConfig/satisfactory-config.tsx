'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import type { Game, GameConfig } from '@/models/config';
import { SatisfactoryConfig } from '@/models/gameSpecificConfig/SatisfactoryConfig';
import { ConfigContainer } from '../shared/config-container';
import { ConfigSettingItem } from '../shared/config-setting-item';
import { NumberConfigInput } from '../shared/number-config-input';
import { GameConfigProps } from './minecraft-config';

export const SatisfactoryConfigComponent = forwardRef(function SatisfactoryConfigComponent(
    { game, onSubmit, initialConfig }: GameConfigProps,
    ref,
) {
    const t = useTranslations('buyGameServer.gameConfig');
    const [config, setConfig] = useState<SatisfactoryConfig>({
        version: 'release',
        max_players: 8,
        num_autosaves: 4,
        upload_crash_report: true,
        autosave_interval: 900,
    });

    // Restore from initialConfig when returning from checkout
    useEffect(() => {
        if (!initialConfig) return;
        const saved = initialConfig.gameSpecificConfig as SatisfactoryConfig;
        if (saved) {
            setConfig(saved);
        }
    }, [initialConfig]);

    const handleChange = <K extends keyof SatisfactoryConfig>(
        key: K,
        value: SatisfactoryConfig[K],
    ) => {
        setConfig({ ...config, [key]: value });
    };

    useImperativeHandle(ref, () => ({
        submit: () => {
            // Create a complete game configuration object
            const completeConfig: GameConfig = {
                gameSlug: game.slug as 'satisfactory',
                eggId: game.data.egg_id,
                version: 'latest', // Assuming we always use the latest version
                dockerImage: game.data.docker_image,
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
            {/* Early Access Toggle */}
            <ConfigSettingItem
                id="isEarlyAccess"
                label="Use Early Access Branch (Experimental)"
                description="Enable experimental features and latest updates"
            >
                <Switch
                    id="isEarlyAccess"
                    checked={config.version === 'experimental'}
                    onCheckedChange={(checked) =>
                        handleChange('version', checked ? 'experimental' : 'release')
                    }
                />
            </ConfigSettingItem>

            {/* MAX_PLAYERS */}
            <ConfigSettingItem
                id="maxPlayers"
                label="Max Players"
                description="Maximum number of concurrent players"
            >
                <NumberConfigInput
                    id="maxPlayers"
                    min={1}
                    max={64}
                    value={config.max_players ?? 8}
                    onChange={(v) => handleChange('max_players', v)}
                />
            </ConfigSettingItem>

            {/* NUM_AUTOSAVES */}
            <ConfigSettingItem
                id="numAutosaves"
                label="Number of Autosaves"
                description="How many autosave files to keep"
            >
                <NumberConfigInput
                    id="numAutosaves"
                    min={1}
                    max={100}
                    value={config.num_autosaves ?? 4}
                    onChange={(v) => handleChange('num_autosaves', v)}
                />
            </ConfigSettingItem>

            {/* AUTOSAVE_INTERVAL */}
            <ConfigSettingItem
                id="autosaveInterval"
                label="Autosave Interval (seconds)"
                description="Time between autosaves"
            >
                <NumberConfigInput
                    id="autosaveInterval"
                    min={60}
                    max={36000}
                    value={config.autosave_interval ?? 900}
                    onChange={(v) => handleChange('autosave_interval', v)}
                />
            </ConfigSettingItem>

            {/* UPLOAD_CRASH_REPORT */}
            <ConfigSettingItem
                id="uploadCrashReport"
                label="Upload Crash Reports"
                description="Enable sending crash reports"
            >
                <Switch
                    id="uploadCrashReport"
                    checked={config.upload_crash_report}
                    onCheckedChange={(checked) => handleChange('upload_crash_report', checked)}
                />
            </ConfigSettingItem>
        </ConfigContainer>
    );
});
