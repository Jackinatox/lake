'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
            <div className="space-y-3 md:space-y-4">
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1">
                            <CardTitle>
                                {t('description')}
                            </CardTitle>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                    {/* Factorio Version */}
                    <div className="flex flex-row items-start justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                            <Label htmlFor="version" className="text-sm font-medium cursor-pointer">
                                Factorio Version
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Select the game version to run
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
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
                    </div>

                    {/* Maximum Slots */}
                    <div className="flex flex-row items-start justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                            <Label
                                htmlFor="maxSlots"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Maximum Slots
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Maximum number of player slots
                            </p>
                        </div>
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
                            className="w-24 sm:w-40 shrink-0"
                        />
                    </div>

                    {/* Save Name */}
                    <div className="flex flex-row items-start justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                            <Label
                                htmlFor="saveName"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Save Name
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Name for the save file (max 20 characters)
                            </p>
                        </div>
                        <Input
                            id="saveName"
                            type="text"
                            maxLength={20}
                            value={config.saveName}
                            onChange={(e) => handleChange('saveName', e.target.value.slice(0, 20))}
                            className="w-32 sm:w-40 shrink-0"
                        />
                    </div>

                    {/* Server Description */}
                    <div className="flex flex-row items-start justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                            <Label
                                htmlFor="serverDescription"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Server Description
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Description shown in server browser (max 100 characters)
                            </p>
                        </div>
                        <Input
                            id="serverDescription"
                            type="text"
                            maxLength={100}
                            value={config.serverDescription}
                            onChange={(e) =>
                                handleChange('serverDescription', e.target.value.slice(0, 100))
                            }
                            className="w-32 sm:w-60 shrink-0"
                        />
                    </div>

                    {/* Auto Save Interval */}
                    <div className="flex flex-row items-start justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                            <Label
                                htmlFor="autoSaveInterval"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Auto Save Interval (minutes)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Time between autosaves (1-999)
                            </p>
                        </div>
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
                            className="w-24 sm:w-40 shrink-0"
                        />
                    </div>

                    {/* Auto Save Slots - Slider */}
                    <div className="flex flex-row items-center justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                            <Label
                                htmlFor="autoSaveSlots"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Auto Save Slots
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Number of rotating autosave slots: {config.autoSaveSlots}
                            </p>
                        </div>
                        <div className="w-32 sm:w-48 shrink-0">
                            <Slider
                                id="autoSaveSlots"
                                min={1}
                                max={20}
                                step={1}
                                value={[config.autoSaveSlots]}
                                onValueChange={([value]) => handleChange('autoSaveSlots', value)}
                            />
                        </div>
                    </div>

                    {/* AFK Kick */}
                    <div className="flex flex-row items-center justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                            <Label htmlFor="afkKick" className="text-sm font-medium cursor-pointer">
                                AFK Kick
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Automatically kick idle players
                            </p>
                        </div>
                        <Switch
                            id="afkKick"
                            checked={config.afkKick}
                            onCheckedChange={(checked) => handleChange('afkKick', checked)}
                            className="shrink-0"
                        />
                    </div>

                    {/* Mods/DLC Dropdown */}
                    <div className="flex flex-row items-start justify-between gap-3 p-3 md:p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                            <Label className="text-sm font-medium">Mods / DLC</Label>
                            <p className="text-xs text-muted-foreground">
                                Enable DLC content for the server
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-32 sm:w-40 justify-between shrink-0"
                                >
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
                    </div>
                </div>
            </div>
        );
    },
);
