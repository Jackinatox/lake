'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { GameConfigProps } from './minecraft-config';
import { ConfigContainer } from '../shared/config-container';
import { GameConfig } from '@/models/config';
import { HytaleConfig } from '@/models/gameSpecificConfig/HytaleConfig';
import { ConfigSettingItem } from '../shared/config-setting-item';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const defConfig: HytaleConfig = {
    auth_mode: 'authenticated',
    patchline: 'release',
    accept_early_plugins: false,
    allow_op: false,
    install_sourcequery_plugin: true,
    disable_sentry: false,
    use_aot_cache: true,
};

export const HytaleConfigComponent = forwardRef(function HytaleConfigComponent(
    { game, onSubmit }: GameConfigProps,
    ref,
) {
    const t = useTranslations('buyGameServer.gameConfig');
    const [config, setConfig] = useState<HytaleConfig>(defConfig);

    const handleChange = <K extends keyof HytaleConfig>(key: K, value: HytaleConfig[K]) => {
        setConfig({ ...config, [key]: value });
    };

    useImperativeHandle(ref, () => ({
        submit: () => {
            const completeConfig: GameConfig = {
                gameId: game.id,
                eggId: game.data.eggId,
                version: 'unused',
                dockerImage: game.data.docker_image,
                gameSpecificConfig: {
                    ...config,
                },
            };
            onSubmit(completeConfig);
        },
    }));

    return (
        <ConfigContainer>
            {/* Auth Mode */}
            <ConfigSettingItem
                id="authMode"
                label="Authentication Mode"
                description="Server authentication method"
            >
                <Select
                    value={config.auth_mode}
                    onValueChange={(value: 'authenticated' | 'offline') =>
                        handleChange('auth_mode', value)
                    }
                >
                    <SelectTrigger className="w-48 md:w-56">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="authenticated">Authenticated</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                </Select>
            </ConfigSettingItem>

            {/* Patchline */}
            <ConfigSettingItem
                id="patchline"
                label="Version Branch"
                description="Choose between stable release or pre-release builds"
            >
                <Select
                    value={config.patchline}
                    onValueChange={(value: 'release' | 'pre-release') =>
                        handleChange('patchline', value)
                    }
                >
                    <SelectTrigger className="w-48 md:w-56">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="release">Release</SelectItem>
                        <SelectItem value="pre-release">Pre-Release</SelectItem>
                    </SelectContent>
                </Select>
            </ConfigSettingItem>

            {/* Accept Early Plugins */}
            <ConfigSettingItem
                id="acceptEarlyPlugins"
                label="Accept Early Plugins"
                description="Warning: May cause stability issues"
            >
                <Switch
                    id="acceptEarlyPlugins"
                    checked={config.accept_early_plugins}
                    onCheckedChange={(checked) => handleChange('accept_early_plugins', checked)}
                />
            </ConfigSettingItem>

            {/* Allow Operators */}
            <ConfigSettingItem
                id="allowOp"
                label="Allow Operators"
                description="Enable server operator privileges"
            >
                <Switch
                    id="allowOp"
                    checked={config.allow_op}
                    onCheckedChange={(checked) => handleChange('allow_op', checked)}
                />
            </ConfigSettingItem>

            {/* Install Source Query Plugin */}
            <ConfigSettingItem
                id="installSourceQuery"
                label="Install Source Query Plugin"
                description="Enables server status queries (player count, server info)"
            >
                <Switch
                    id="installSourceQuery"
                    checked={config.install_sourcequery_plugin}
                    onCheckedChange={(checked) =>
                        handleChange('install_sourcequery_plugin', checked)
                    }
                />
            </ConfigSettingItem>
        </ConfigContainer>
    );
});
