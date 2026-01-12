'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ConsoleV2 from './ConsoleV2';
import { PerformanceMetrics } from './PerformanceMetrics';
import { GameServer } from '@/models/gameServerModel';

interface ConsolePanelProps {
    server: GameServer;
    serverStats: any;
    logs: string[];
    handleCommand: (command: string) => void;
}

export function ConsolePanel({ server, serverStats, logs, handleCommand }: ConsolePanelProps) {
    const t = useTranslations();

    return (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 max-w-full overflow-hidden">
            {/* Console Card - Full width on mobile, 8 cols on desktop */}
            <Card className="lg:col-span-8 min-h-0 overflow-hidden">
                <CardHeader className="p-3 sm:p-6 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Terminal className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        {t('gameserver.tabs.console')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Console terminal */}
                        <div className="h-64 sm:h-80 lg:h-96">
                            <ConsoleV2 logs={logs} handleCommand={handleCommand} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance metrics - Full width on mobile, 4 cols on desktop */}
            <div className="lg:col-span-4">
                <PerformanceMetrics server={server} serverStats={serverStats} />
            </div>
        </div>
    );
}
