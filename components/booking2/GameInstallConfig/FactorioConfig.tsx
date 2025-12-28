'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import type { Game, GameConfig } from '@/models/config';
import {
    FactorioConfig,
    FactorioDLC,
    FactorioVersion,
} from '@/models/gameSpecificConfig/FactorioConfig';
import { ConfigContainer } from '../shared/config-container';
import { ConfigSettingItem } from '../shared/config-setting-item';

interface FactorioConfigProps {
    game: Game;
    onSubmit: (config: GameConfig) => void;
}

const DLC_OPTIONS: { id: FactorioDLC; label: string }[] = [
    { id: 'elevated-rails', label: 'Elevated Rails' },
    { id: 'quality', label: 'Quality' },
    { id: 'space-age', label: 'Space Age' },
];

export const FactorioConfigComponent = forwardRef(
    ({ game, onSubmit }: FactorioConfigProps, ref) => {
        const t = useTranslations('buyGameServer.gameConfig');

        const [config, setConfig] = useState<FactorioConfig>({
            version: 'latest',
            customVersion: '',
            maxSlots: 16,
            saveName: 'world',
            serverDescription: 'Factorio Server by Scyed',
            autoSaveInterval: 10,
            autoSaveSlots: 5,
            afkKick: false,
            enabledDLCs: ['elevated-rails', 'quality', 'space-age'],
        });

        const handleChange = <K extends keyof FactorioConfig>(key: K, value: FactorioConfig[K]) => {
            setConfig({ ...config, [key]: value });
        };

        const toggleDLC = (dlc: FactorioDLC) => {
            const current = config.enabledDLCs;
            if (current.includes(dlc)) {
                handleChange(
                    'enabledDLCs',
                    current.filter((d) => d !== dlc),
                );
            } else {
                handleChange('enabledDLCs', [...current, dlc]);
            }
        };

        useImperativeHandle(ref, () => ({
            submit: () => {
                const completeConfig: GameConfig = {
                    gameId: game.id,
                    eggId: game.data.egg_id,
                    version:
                        config.version === 'custom'
                            ? config.customVersion || 'latest'
                            : config.version,
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
                {/* Factorio Version */}
                <ConfigSettingItem
                    id="version"
                    label="Factorio Version"
                    description="Select the game version to run"
                    alignStart
                >
                    <div className="flex flex-col gap-2">
                        <Select
                            value={config.version}
                            onValueChange={(value: FactorioVersion) =>
                                handleChange('version', value)
                            }
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select version" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">Latest</SelectItem>
                                <SelectItem value="experimental">Experimental</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                        {config.version === 'custom' && (
                            <Input
                                placeholder="e.g. 2.0.72"
                                value={config.customVersion}
                                onChange={(e) => handleChange('customVersion', e.target.value)}
                                className="w-40"
                            />
                        )}
                    </div>
                </ConfigSettingItem>

                {/* Maximum Slots */}
                <ConfigSettingItem
                    id="maxSlots"
                    label="Maximum Slots"
                    description="Maximum number of player slots"
                >
                    <Input
                        id="maxSlots"
                        type="number"
                        min={1}
                        max={32767}
                        value={config.maxSlots}
                        onChange={(e) =>
                            handleChange(
                                'maxSlots',
                                Math.max(1, Math.min(32767, Number(e.target.value) || 1)),
                            )
                        }
                        className="w-24 md:w-40"
                    />
                </ConfigSettingItem>

                {/* Save Name */}
                <ConfigSettingItem
                    id="saveName"
                    label="Save Name"
                    description="Name for the save file (max 20 characters)"
                >
                    <Input
                        id="saveName"
                        type="text"
                        maxLength={20}
                        value={config.saveName}
                        onChange={(e) => handleChange('saveName', e.target.value.slice(0, 20))}
                        className="w-32 md:w-40"
                    />
                </ConfigSettingItem>

                {/* Server Description */}
                <ConfigSettingItem
                    id="serverDescription"
                    label="Server Description"
                    description="Description shown in server browser (max 100 characters)"
                >
                    <Input
                        id="serverDescription"
                        type="text"
                        maxLength={100}
                        value={config.serverDescription}
                        onChange={(e) =>
                            handleChange('serverDescription', e.target.value.slice(0, 100))
                        }
                        className="w-32 md:w-60"
                    />
                </ConfigSettingItem>

                {/* Auto Save Interval */}
                <ConfigSettingItem
                    id="autoSaveInterval"
                    label="Auto Save Interval (minutes)"
                    description="Time between autosaves (1-999)"
                >
                    <Input
                        id="autoSaveInterval"
                        type="number"
                        min={1}
                        max={999}
                        value={config.autoSaveInterval}
                        onChange={(e) =>
                            handleChange(
                                'autoSaveInterval',
                                Math.max(1, Math.min(999, Number(e.target.value) || 1)),
                            )
                        }
                        className="w-24 md:w-40"
                    />
                </ConfigSettingItem>

                {/* Auto Save Slots - Slider */}
                <ConfigSettingItem
                    id="autoSaveSlots"
                    label="Auto Save Slots"
                    description={`Number of rotating autosave slots: ${config.autoSaveSlots}`}
                >
                    <div className="w-32 md:w-48">
                        <Slider
                            id="autoSaveSlots"
                            min={1}
                            max={20}
                            step={1}
                            value={[config.autoSaveSlots]}
                            onValueChange={([value]) => handleChange('autoSaveSlots', value)}
                        />
                    </div>
                </ConfigSettingItem>

                {/* AFK Kick */}
                <ConfigSettingItem
                    id="afkKick"
                    label="AFK Kick"
                    description="Automatically kick idle players"
                >
                    <Switch
                        id="afkKick"
                        checked={config.afkKick}
                        onCheckedChange={(checked) => handleChange('afkKick', checked)}
                    />
                </ConfigSettingItem>

                {/* Mods/DLC Dropdown */}
                <ConfigSettingItem
                    id="dlc"
                    label="Mods / DLC"
                    description="Enable DLC content for the server"
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-32 md:w-40 justify-between">
                                {config.enabledDLCs.length > 0
                                    ? `${config.enabledDLCs.length} selected`
                                    : 'Select DLCs'}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48">
                            <DropdownMenuLabel>DLC Content</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {DLC_OPTIONS.map((dlc) => (
                                <DropdownMenuCheckboxItem
                                    key={dlc.id}
                                    checked={config.enabledDLCs.includes(dlc.id)}
                                    onCheckedChange={() => toggleDLC(dlc.id)}
                                >
                                    {dlc.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ConfigSettingItem>
            </ConfigContainer>
        );
    },
);
