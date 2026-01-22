'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { Game, GameConfig } from '@/models/config';
import { SatisfactoryConfig } from '@/models/gameSpecificConfig/SatisfactoryConfig';
import { ConfigContainer } from '../shared/config-container';
import { ConfigSettingItem } from '../shared/config-setting-item';
import { GameConfigProps } from './minecraft-config';

export const SatisfactoryConfigComponent = forwardRef(
    function SatisfactoryConfigComponent({ game, onSubmit }: GameConfigProps, ref) {
        const t = useTranslations('buyGameServer.gameConfig');
        const [config, setConfig] = useState<SatisfactoryConfig>({
            version: 'release',
            max_players: 8,
            num_autosaves: 4,
            upload_crash_report: true,
            autosave_interval: 300,
        });

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
                    gameId: game.id,
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
                    label="Use Early Access (Experimental)"
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
                    <Input
                        id="maxPlayers"
                        type="number"
                        min={1}
                        max={64}
                        value={config.max_players ?? 8}
                        onChange={(e) =>
                            handleChange(
                                'max_players',
                                Math.max(1, Math.min(64, Number(e.target.value) || 0)),
                            )
                        }
                        className="w-24 md:w-40"
                    />
                </ConfigSettingItem>

                {/* NUM_AUTOSAVES */}
                <ConfigSettingItem
                    id="numAutosaves"
                    label="Number of Autosaves"
                    description="How many autosave files to keep"
                >
                    <Input
                        id="numAutosaves"
                        type="number"
                        min={1}
                        max={100}
                        value={config.num_autosaves ?? 4}
                        onChange={(e) =>
                            handleChange(
                                'num_autosaves',
                                Math.max(1, Math.min(100, Number(e.target.value) || 0)),
                            )
                        }
                        className="w-24 md:w-40"
                    />
                </ConfigSettingItem>

                {/* AUTOSAVE_INTERVAL */}
                <ConfigSettingItem
                    id="autosaveInterval"
                    label="Autosave Interval (seconds)"
                    description="Time between autosaves"
                >
                    <Input
                        id="autosaveInterval"
                        type="number"
                        min={60}
                        max={3600}
                        step={30}
                        value={config.autosave_interval ?? 300}
                        onChange={(e) =>
                            handleChange(
                                'autosave_interval',
                                Math.max(60, Math.min(3600, Number(e.target.value) || 0)),
                            )
                        }
                        className="w-24 md:w-40"
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
    },
);
