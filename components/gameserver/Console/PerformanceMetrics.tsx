'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Cpu, MemoryStickIcon as Memory } from 'lucide-react';
import { useTranslations } from 'next-intl';
import CPUChart from './graphs/CPUChart';
import RAMChart from './graphs/RAMChart';
import { GameServer } from '@/models/gameServerModel';

interface PerformanceMetricsProps {
    server: GameServer;
    serverStats: any;
}

export function PerformanceMetrics({ server, serverStats }: PerformanceMetricsProps) {
    const t = useTranslations();

    return (
        <div className="flex flex-col gap-3 sm:gap-4">
            {/* CPU Card */}
            <Card className="overflow-hidden">
                <CardHeader className="p-2 sm:p-4 pb-0 sm:pb-0 space-y-0">
                    <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base">
                        <Cpu className="h-4 w-4 shrink-0" />
                        <span className="truncate text-xs sm:text-sm">
                            CPU ({server.limits.cpu / 100} {t('gameserver.dashboard.cpu.cores')})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 pt-1 sm:pt-2">
                    <div className="h-24 sm:h-32">
                        <CPUChart newData={serverStats} />
                    </div>
                    <Separator className="my-1.5 sm:my-2" />
                    <div className="flex justify-between text-[10px] sm:text-xs">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-mono">{serverStats?.cpu_absolute ?? 0}%</span>
                    </div>
                </CardContent>
            </Card>

            {/* RAM Card */}
            <Card className="overflow-hidden">
                <CardHeader className="p-2 sm:p-4 pb-0 sm:pb-0 space-y-0">
                    <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base">
                        <Memory className="h-4 w-4 shrink-0" />
                        <span className="truncate text-xs sm:text-sm">
                            {t('gameserver.dashboard.memory.usage')}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 pt-1 sm:pt-2">
                    <div className="h-24 sm:h-32">
                        <RAMChart
                            newData={{
                                ...serverStats,
                                memory_limit_bytes: server.limits.memory / 1024,
                            }}
                        />
                    </div>
                    <Separator className="my-1.5 sm:my-2" />
                    <div className="flex justify-between text-[10px] sm:text-xs">
                        <span className="text-muted-foreground">Current</span>
                        <span className="font-mono">
                            {serverStats?.memory_bytes ?? 0} / {server.limits.memory / 1024} GiB
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
