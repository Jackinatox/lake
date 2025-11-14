'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TerrariaConfigProps {
    onChange: (config: Record<string, any>) => void;
}

export function TerrariaConfigComponent({ onChange }: TerrariaConfigProps) {
    const [config, setConfig] = useState({
        serverName: 'My Terraria Server',
        maxPlayers: 8,
        worldSize: 'medium',
        difficulty: 'classic',
        enablePvp: false,
        autoSave: true,
        banlistEnabled: true,
        seed: '',
        password: '',
    });

    const handleChange = (key: string, value: any) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onChange(newConfig);
    };

    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
            <Card className="shadow-sm">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex w-full justify-between p-4 text-left">
                        <span className="text-sm sm:text-base font-medium">
                            Advanced Terraria Configuration
                        </span>
                        {isOpen ? (
                            <ChevronUp className="h-4 w-4 shrink-0" />
                        ) : (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                        )}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-2 pb-6 space-y-4 sm:space-y-6">
                        {/* Server Name */}
                        <div className="space-y-2">
                            <Label htmlFor="serverName" className="text-sm font-medium">
                                Server Name
                            </Label>
                            <Input
                                id="serverName"
                                value={config.serverName}
                                onChange={(e) => handleChange('serverName', e.target.value)}
                                className="w-full"
                                placeholder="Enter your server name"
                            />
                        </div>

                        {/* Max Players */}
                        <div className="space-y-3">
                            <Label htmlFor="maxPlayers" className="text-sm font-medium">
                                Max Players:{' '}
                                <span className="font-semibold">{config.maxPlayers}</span>
                            </Label>
                            <div className="px-2">
                                <Slider
                                    id="maxPlayers"
                                    value={[config.maxPlayers]}
                                    min={1}
                                    max={16}
                                    step={1}
                                    onValueChange={(value) => handleChange('maxPlayers', value[0])}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>1 player</span>
                                    <span>16 players</span>
                                </div>
                            </div>
                        </div>

                        {/* World Size */}
                        <div className="space-y-2">
                            <Label htmlFor="worldSize" className="text-sm font-medium">
                                World Size
                            </Label>
                            <select
                                id="worldSize"
                                className="w-full p-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={config.worldSize}
                                onChange={(e) => handleChange('worldSize', e.target.value)}
                            >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-2">
                            <Label htmlFor="difficulty" className="text-sm font-medium">
                                Difficulty
                            </Label>
                            <select
                                id="difficulty"
                                className="w-full p-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={config.difficulty}
                                onChange={(e) => handleChange('difficulty', e.target.value)}
                            >
                                <option value="classic">Classic</option>
                                <option value="expert">Expert</option>
                                <option value="master">Master</option>
                                <option value="journey">Journey</option>
                            </select>
                        </div>

                        {/* World Seed */}
                        <div className="space-y-2">
                            <Label htmlFor="seed" className="text-sm font-medium">
                                World Seed (optional)
                            </Label>
                            <Input
                                id="seed"
                                value={config.seed}
                                onChange={(e) => handleChange('seed', e.target.value)}
                                placeholder="Leave blank for random"
                                className="w-full"
                            />
                        </div>

                        {/* Server Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Server Password (optional)
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={config.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                placeholder="Leave blank for no password"
                                className="w-full"
                            />
                        </div>

                        {/* Switch Controls */}
                        <div className="space-y-4">
                            {/* PvP Toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="enablePvp"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Enable PvP
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Allow players to fight each other
                                    </p>
                                </div>
                                <Switch
                                    id="enablePvp"
                                    checked={config.enablePvp}
                                    onCheckedChange={(checked) =>
                                        handleChange('enablePvp', checked)
                                    }
                                />
                            </div>

                            {/* Auto Save Toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="autoSave"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Auto Save
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Automatically save world progress
                                    </p>
                                </div>
                                <Switch
                                    id="autoSave"
                                    checked={config.autoSave}
                                    onCheckedChange={(checked) => handleChange('autoSave', checked)}
                                />
                            </div>

                            {/* Banlist Toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="banlistEnabled"
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        Enable Banlist
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Allow banning of problematic players
                                    </p>
                                </div>
                                <Switch
                                    id="banlistEnabled"
                                    checked={config.banlistEnabled}
                                    onCheckedChange={(checked) =>
                                        handleChange('banlistEnabled', checked)
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
