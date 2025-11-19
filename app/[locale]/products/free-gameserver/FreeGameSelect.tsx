'use client';

import GameCard from '@/components/order/game/gameCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FreeTierConfig } from '@/lib/free-tier/config';
import { CheckCircle, Clock, Cpu, HardDrive, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FreeServerUsageCard from '@/components/order/free-server/FreeServerUsageCard';

interface Game {
    id: number;
    name: string;
    images: {
        dark: string;
        light: string;
    };
}

interface FreeGameSelectProps {
    games: Game[];
    freeTierConfig: FreeTierConfig;
    userFreeServers?: number;
}

export default function FreeGameSelect({
    games,
    freeTierConfig,
    userFreeServers,
}: FreeGameSelectProps) {
    const t = useTranslations('freeServer');

    // Convert values for display
    const cpuCores = freeTierConfig.cpu / 100;
    const ramInGB = freeTierConfig.ram / 1024;
    const storageInGB = freeTierConfig.storage / 1024;
    const limitReached = userFreeServers ? userFreeServers >= freeTierConfig.maxServers : false;

    return (
        <>
            {/* Features Card */}
            <div className="flex justify-center w-full">
                <Card className="mb-2 md:mb-6 w-full max-w-lg md:max-w-2xl lg:max-w-3xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl md:text-2xl">{t('featuresTitle')}</CardTitle>
                        <CardDescription>{t('featuresDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Cpu className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {t('cpuLabel', { cores: cpuCores })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('cpuDescription')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {t('ramLabel', { amount: ramInGB })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('ramDescription')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <HardDrive className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {t('storageLabel', { amount: storageInGB })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('storageDescription')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {t('durationLabel', { days: freeTierConfig.duration })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('durationDescription')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircle className="h-5 w-5" />
                                <p className="font-semibold">{t('noCreditCard')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Free Server Usage Card */}
            {userFreeServers !== undefined && (
                <FreeServerUsageCard
                    userFreeServers={userFreeServers}
                    maxServers={freeTierConfig.maxServers}
                />
            )}

            {/* Game Selection */}
            <div className="max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-5 md:mb-6">
                    {t('chooseGame')}
                </h2>
                <div
                    className={`flex flex-wrap gap-4 justify-center ${
                        limitReached ? 'opacity-50 pointer-events-none' : ''
                    }`}
                >
                    {games.map((game) => (
                        <GameCard
                            key={game.id}
                            card={{
                                link: limitReached
                                    ? '#'
                                    : `/products/free-gameserver/${game.id.toString()}`,
                                name: game.name,
                            }}
                            images={game.images}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
