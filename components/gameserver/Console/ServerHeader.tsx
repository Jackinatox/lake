'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameServer } from '@/models/gameServerModel';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import GameInfo from '../settings/gameSpecific/info/GameInfo';
import { PowerBtns } from './powerBtns';
import { Status } from './status';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ServerHeaderProps {
    server: GameServer;
    ptApiKey: string;
    serverStats: any;
    loading: boolean;
    onStart: () => void;
    onStop: () => void;
    onRestart: () => void;
    onKill: () => void;
}

export function ServerHeader({
    server,
    ptApiKey,
    serverStats,
    loading,
    onStart,
    onStop,
    onRestart,
    onKill,
}: ServerHeaderProps) {
    const t = useTranslations();
    const pathname = usePathname();
    const [copied, setCopied] = useState(false);

    // Calculate uptime
    const days = Math.floor(serverStats?.uptime / 86400);
    const hours = Math.floor((serverStats?.uptime % 86400) / 3600);
    const minutes = Math.floor((serverStats?.uptime % 3600) / 60);
    const seconds = Math.floor(serverStats?.uptime % 60);

    // Get default allocation for IP:Port
    const defAlloc = server.relationships.allocations.data.find(
        (alloc: any) => alloc.attributes.is_default
    );
    const ipPortCombo = defAlloc
        ? defAlloc.attributes.ip_alias + ':' + defAlloc.attributes.port
        : null;

    const handleCopyIP = async () => {
        if (ipPortCombo) {
            await navigator.clipboard.writeText(ipPortCombo);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatUptime = () => {
        if (serverStats?.uptime === undefined) return '—';
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);
        return parts.join(' ');
    };

    return (
        <Card className="border-2 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 mb-3 sm:mb-4 max-w-full overflow-hidden">
            <CardHeader className="p-3 sm:p-6 pb-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base sm:text-xl font-bold truncate min-w-0">
                        {server.name}
                    </CardTitle>
                    <Button asChild variant="outline" size="sm" className="w-fit shrink-0">
                        <Link href={`${pathname}/upgrade`}>
                            {t('gameserver.dashboard.header.upgrade')}
                        </Link>
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                    {/* Server Info Section */}
                    <div className="rounded-md bg-slate-100 p-2 sm:p-3 dark:bg-slate-800 lg:col-span-5 overflow-hidden">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:gap-2 text-xs sm:text-sm">
                            {/* Status Row */}
                            <div className="font-medium text-muted-foreground">
                                {t('gameserver.dashboard.status')}
                            </div>
                            <div>
                                <Badge
                                    variant={
                                        serverStats?.state?.toLowerCase() === 'online'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-xs"
                                >
                                    <Status state={serverStats?.state} />
                                </Badge>
                            </div>

                            {/* Server IP Row */}
                            <div className="font-medium text-muted-foreground">
                                {t('gameserver.dashboard.serverIP')}
                            </div>
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="font-mono text-[10px] sm:text-xs truncate">
                                    {ipPortCombo || t('gameserver.dashboard.noAllocation')}
                                </span>
                                {ipPortCombo && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 shrink-0"
                                        onClick={handleCopyIP}
                                    >
                                        {copied ? (
                                            <Check className="h-3 w-3" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                )}
                            </div>

                            {/* Game Info Row */}
                            <div className="font-medium text-muted-foreground">
                                {t('gameserver.dashboard.info')}
                            </div>
                            <div className="truncate">
                                <GameInfo server={server} apiKey={ptApiKey} />
                            </div>

                            {/* Uptime Row */}
                            <div className="font-medium text-muted-foreground">
                                {t('gameserver.dashboard.uptime')}
                            </div>
                            <div className="font-mono text-[10px] sm:text-xs">{formatUptime()}</div>
                        </div>
                    </div>

                    {/* Server Controls Section */}
                    <div className="rounded-md border bg-card p-2 sm:p-3 lg:col-span-7">
                        <h3 className="mb-2 text-xs sm:text-sm font-semibold">
                            {t('gameserver.dashboard.serverControls')}
                        </h3>
                        <PowerBtns
                            loading={loading}
                            onStart={onStart}
                            onStop={onStop}
                            onRestart={onRestart}
                            onKill={onKill}
                            state={serverStats?.state}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
