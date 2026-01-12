'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import webSocket from '@/lib/Pterodactyl/webSocket';
import { GameServer } from '@/models/gameServerModel';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Clock,
    Cpu,
    HardDrive,
    MemoryStickIcon as Memory,
    Play,
    Power,
    RefreshCw,
    Square,
    Terminal,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import EulaDialog from '../EulaDialog';
import FileManager from '../FileManager/FileManager';
import { writeFile } from '../FileManager/pteroFileApi';
import { TabsComponent } from '../GameserverTabs';
import GameServerSettings from '../settings/GameServerSettings';
import GameInfo from '../settings/gameSpecific/info/GameInfo';
import { ServerAddress } from '../ServerAddress';
import ConsoleV2 from './ConsoleV2';
import CPUChart from './graphs/CPUChart';
import RAMChart from './graphs/RAMChart';
import { Status } from './status';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import BackupManager from '../BackupManager/BackupManager';

interface serverProps {
    server: GameServer;
    ptApiKey: string;
}

function GameDashboard({ server, ptApiKey }: serverProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [eulaOpen, setEulaOpen] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const wsCreds = useRef<any>(null);
    const searchParams = useSearchParams();
    const autoStart = useRef(searchParams.get('start') === 'true');
    const router = useRouter();
    const t = useTranslations();

    const pathname = usePathname();

    const [serverStats, setServerStats] = useState<any>();

    const handleWsMessage = async (msg: string) => {
        const data = JSON.parse(msg);

        switch (data.event) {
            case 'stats': {
                const stats = JSON.parse(data.args[0]);

                const smallToZero = (n: number) => (n < 1 ? 0 : n);

                const cpu = Number.parseFloat(
                    Math.min((stats.cpu_absolute / server.limits.cpu) * 100, 100).toFixed(1),
                );
                const disk = Number.parseFloat((stats.disk_bytes / 1024 / 1024 / 1024).toFixed(2));
                const memory = Number.parseFloat(
                    (stats.memory_bytes / 1024 / 1024 / 1024).toFixed(2),
                );
                const memoryLimit = Number.parseFloat(
                    (stats.memory_limit_bytes / 1024 / 1024 / 1024).toFixed(2),
                );
                const uptime = Number.parseFloat((stats.uptime / 1000).toFixed(2));

                const roundedStats = {
                    cpu_absolute: smallToZero(cpu),
                    disk_bytes: smallToZero(disk),
                    memory_bytes: memory,
                    memory_limit_bytes: smallToZero(memoryLimit),
                    network: {
                        rx_bytes: stats.network.rx_bytes,
                        tx_bytes: stats.network.tx_bytes,
                    },
                    state: stats.state,
                    uptime: smallToZero(uptime),
                };
                setServerStats(roundedStats);
                break;
            }

            case 'console output': {
                const consoleLine = data.args[0];
                if (
                    consoleLine.includes(
                        'You need to agree to the EULA in order to run the server.',
                    )
                ) {
                    setEulaOpen(true);
                }
                setLogs((prevLogs) => {
                    if (prevLogs[prevLogs.length - 1] === consoleLine) {
                        return prevLogs; // Avoid duplicate log
                    }
                    return [...prevLogs, consoleLine];
                });
                break;
            }

            case 'token expiring': {
                console.log('Token expiring... fetching new token.');

                const wsCred = await webSocket(server.identifier, ptApiKey);
                wsCreds.current = wsCred;

                wsRef.current?.send(JSON.stringify({ event: 'auth', args: [wsCred?.data.token] }));
                console.log('Re-authenticated WebSocket.');

                break;
            }

            case 'auth success': {
                if (loading) {
                    wsRef.current?.send(
                        JSON.stringify({
                            event: 'send logs',
                        }),
                    );
                }

                setLoading(false);

                if (autoStart.current) {
                    // Send start command directly (we know WebSocket is ready)
                    wsRef.current?.send(
                        JSON.stringify({
                            event: 'set state',
                            args: ['start'],
                        }),
                    );
                    autoStart.current = false;
                    router.replace(pathname, { scroll: false });
                } else {
                    console.log('auto satart is false');
                }
            }
        }
    };

    useEffect(() => {
        const startWebSocket = async () => {
            if (!wsRef.current) {
                const wsCred = await webSocket(server.identifier, ptApiKey);
                wsCreds.current = wsCred;

                const ws: WebSocket = new WebSocket(wsCred?.data.socket);
                wsRef.current = ws;

                ws.onopen = () => {
                    ws.send(
                        JSON.stringify({
                            event: 'auth',
                            args: [wsCred?.data.token],
                        }),
                    );
                };

                ws.onmessage = (ev: MessageEvent) => {
                    handleWsMessage(ev.data);
                };
            }
        };

        startWebSocket();

        return () => {
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, []);

    const days = Math.floor(serverStats?.uptime / 86400); // 86400 Sekunden pro Tag
    const hours = Math.floor((serverStats?.uptime % 86400) / 3600); // Restliche Stunden
    const minutes = Math.floor((serverStats?.uptime % 3600) / 60); // Restliche Minuten

    const handleAcceptEula = async () => {
        if (!loading && wsRef.current) {
            await writeFile(server.identifier, 'eula.txt', 'eula=true', ptApiKey);
            killAndRestart();
        }
    };

    const handleStart = () => {
        if (!loading && wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    event: 'set state',
                    args: ['start'],
                }),
            );
        }
    };

    const handleRestart = () => {
        if (!loading && wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    event: 'set state',
                    args: ['restart'],
                }),
            );
        }
    };

    // STOP
    const handleStop = () => {
        if (!loading && wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    event: 'set state',
                    args: ['stop'],
                }),
            );
        }
    };

    const handleKill = () => {
        if (!loading && wsRef.current) {
            wsRef.current.send(
                JSON.stringify({
                    event: 'set state',
                    args: ['kill'],
                }),
            );
        }
    };

    const killAndRestart = () => {
        if (!loading && wsRef.current) {
            handleKill();
            setTimeout(() => {
                handleStart();
            }, 500);
            return;
        }
    };

    const handleCommand = (command: string) => {
        console.log(command);
        wsRef.current?.send(
            JSON.stringify({
                event: 'send command',
                args: [command],
            }),
        );
    };

    const defAlloc = server.relationships.allocations.data.find(
        (alloc: any) => alloc.attributes.is_default,
    );

    const address = defAlloc?.attributes.ip_alias || defAlloc?.attributes.ip || '';
    const port = defAlloc?.attributes.port || 0;

    // Helper to format bytes
    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    };

    // Server state helpers
    const isOnline = serverStats?.state?.toLowerCase() === 'running';
    const isOffline = serverStats?.state?.toLowerCase() === 'offline';
    const isTransitioning = !isOnline && !isOffline && serverStats?.state;

    // Uptime formatted string
    const uptimeString =
        serverStats?.uptime !== undefined
            ? `${days > 0 ? `${days}d ` : ''}${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${Math.floor(serverStats.uptime % 60)}s`
            : '—';

    // Compact Mobile Stats Component - all info in one card
    const MobileStatsCard = (
        <Card className="md:hidden border-0 shadow-sm">
            <CardContent className="py-2 px-3">
                {/* Resource bars row */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {/* CPU */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                                <Cpu className="h-3 w-3 text-blue-500" />
                                <span className="text-muted-foreground">CPU</span>
                            </div>
                            <span className="font-medium tabular-nums">
                                {loading ? '—' : `${serverStats?.cpu_absolute ?? 0}%`}
                            </span>
                        </div>
                        <Progress
                            value={serverStats?.cpu_absolute ?? 0}
                            className="h-1.5 bg-blue-500/20"
                        />
                    </div>

                    {/* RAM */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                                <Memory className="h-3 w-3 text-purple-500" />
                                <span className="text-muted-foreground">RAM</span>
                            </div>
                            <span className="font-medium tabular-nums">
                                {loading ? '—' : `${serverStats?.memory_bytes ?? 0}G`}
                            </span>
                        </div>
                        <Progress
                            value={
                                ((serverStats?.memory_bytes ?? 0) / (server.limits.memory / 1024)) *
                                100
                            }
                            className="h-1.5 bg-purple-500/20"
                        />
                    </div>

                    {/* Disk */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3 text-emerald-500" />
                                <span className="text-muted-foreground">Disk</span>
                            </div>
                            <span className="font-medium tabular-nums">
                                {loading ? '—' : `${serverStats?.disk_bytes ?? 0}G`}
                            </span>
                        </div>
                        <Progress
                            value={
                                ((serverStats?.disk_bytes ?? 0) / (server.limits.disk / 1024)) * 100
                            }
                            className="h-1.5 bg-emerald-500/20"
                        />
                    </div>
                </div>

                {/* Bottom row: Uptime + Network */}
                <div className="flex items-center justify-between text-xs border-t pt-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-cyan-500" />
                            <span className="font-medium tabular-nums">
                                {loading ? '—' : uptimeString}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <GameInfo server={server} apiKey={ptApiKey} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <ArrowDownToLine className="h-3 w-3 text-emerald-500" />
                            <span className="tabular-nums">
                                {loading ? '—' : formatBytes(serverStats?.network?.rx_bytes ?? 0)}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ArrowUpFromLine className="h-3 w-3 text-blue-500" />
                            <span className="tabular-nums">
                                {loading ? '—' : formatBytes(serverStats?.network?.tx_bytes ?? 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    // Desktop Sidebar component - charts + compact stats
    const DesktopSidebar = (
        <>
            {/* CPU Chart */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-2 md:p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">CPU</span>
                    </div>
                    <CPUChart newData={serverStats} cpuLimit={server.limits.cpu / 100} />
                </CardContent>
            </Card>

            {/* RAM Chart */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-2 md:p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Memory className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">RAM</span>
                    </div>
                    <RAMChart newData={serverStats} memoryLimit={server.limits.memory / 1024} />
                </CardContent>
            </Card>

            {/* Compact Stats Card - Disk, Network, Uptime, Game Info */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-3 space-y-2">
                    {/* Disk */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Disk</span>
                        </div>
                        <span className="font-medium tabular-nums">
                            {loading
                                ? '—'
                                : `${serverStats?.disk_bytes ?? 0}/${server.limits.disk / 1024} GB`}
                        </span>
                    </div>
                    <Progress
                        value={((serverStats?.disk_bytes ?? 0) / (server.limits.disk / 1024)) * 100}
                        className="h-1.5 bg-emerald-500/20"
                    />

                    {/* Network */}
                    <div className="flex items-center justify-between text-sm pt-1">
                        <div className="flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            <span>Network</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1">
                                <ArrowDownToLine className="h-3 w-3 text-emerald-500" />
                                {loading ? '—' : formatBytes(serverStats?.network?.rx_bytes ?? 0)}
                            </span>
                            <span className="flex items-center gap-1">
                                <ArrowUpFromLine className="h-3 w-3 text-blue-500" />
                                {loading ? '—' : formatBytes(serverStats?.network?.tx_bytes ?? 0)}
                            </span>
                        </div>
                    </div>

                    {/* Uptime */}
                    <div className="flex items-center justify-between text-sm pt-1">
                        <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-cyan-500" />
                            <span>{t('gameserver.dashboard.uptime')}</span>
                        </div>
                        <span className="font-medium tabular-nums">
                            {loading ? '—' : uptimeString}
                        </span>
                    </div>

                    {/* Game Info */}
                    <div className="flex items-center justify-between text-sm pt-1 border-t">
                        <span className="text-muted-foreground">
                            {t('gameserver.dashboard.info')}
                        </span>
                        <GameInfo server={server} apiKey={ptApiKey} />
                    </div>
                </CardContent>
            </Card>
        </>
    );

    // Console component - now full width in tab content
    const ConsoleComponent = (
        <Card className="border-0 shadow-sm min-h-72 w-full min-w-0">
            <CardContent className="p-2 sm:p-3">
                <ConsoleV2 logs={logs} handleCommand={handleCommand} />
            </CardContent>
        </Card>
    );

    // Charts are now integrated into DesktopSidebar

    return (
        <TooltipProvider>
            <EulaDialog isOpen={eulaOpen} onAcceptEula={handleAcceptEula} setOpen={setEulaOpen} />
            <div className="space-y-3">
                {/* Sticky Header Bar */}
                <Card className="sticky top-0 z-20 border-0 shadow-sm bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
                    <CardContent className="py-2 px-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            {/* Left: Server Name + Status */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    {/* Status indicator with pulse when online */}
                                    <div className="relative">
                                        <div
                                            className={`h-3 w-3 rounded-full ${
                                                isOnline
                                                    ? 'bg-emerald-500'
                                                    : isTransitioning
                                                      ? 'bg-amber-500'
                                                      : 'bg-slate-400'
                                            }`}
                                        />
                                        {isOnline && (
                                            <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-emerald-500 opacity-75" />
                                        )}
                                    </div>
                                    <h1 className="text-base font-bold truncate max-w-40 md:max-w-none">
                                        {server.name}
                                    </h1>
                                </div>
                                <Badge
                                    variant={isOnline ? 'default' : 'outline'}
                                    className="hidden md:flex"
                                >
                                    <Status state={serverStats?.state} />
                                </Badge>
                            </div>

                            {/* Center: Server Address */}
                            <div className="flex items-center gap-2 text-sm">
                                {address && port ? (
                                    <ServerAddress
                                        address={address}
                                        port={port}
                                        eggId={server.egg_id}
                                    />
                                ) : (
                                    <span className="text-muted-foreground">
                                        {t('gameserver.dashboard.noAllocation')}
                                    </span>
                                )}
                            </div>

                            {/* Right: Power Controls + Upgrade */}
                            <div className="flex items-center gap-2">
                                {/* Power Buttons */}
                                <div className="flex items-center gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant={isOnline ? 'outline' : 'default'}
                                                size="icon"
                                                onClick={handleStart}
                                                disabled={loading || isOnline || isTransitioning}
                                                className="h-8 w-8"
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Start</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleStop}
                                                disabled={loading || isOffline}
                                                className="h-8 w-8"
                                            >
                                                <Square className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Stop</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleRestart}
                                                disabled={loading || isOffline}
                                                className="h-8 w-8"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Restart</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={handleKill}
                                                disabled={loading || isOffline}
                                                className="h-8 w-8"
                                            >
                                                <Power className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Kill</TooltipContent>
                                    </Tooltip>
                                </div>

                                {/* Upgrade Button */}
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`${pathname}/upgrade`}>
                                        {t('gameserver.dashboard.header.upgrade')}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Mobile Stats Card */}
                {MobileStatsCard}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-stretch">
                    {/* Main Content Area - Tabs */}
                    <div className="w-full md:col-span-8 min-w-0">
                        <TabsComponent
                            consoleComponent={ConsoleComponent}
                            fileManagerComponent={<FileManager server={server} apiKey={ptApiKey} />}
                            backupManagerComponent={
                                <BackupManager server={server} apiKey={ptApiKey} />
                            }
                            settingsComponent={
                                <GameServerSettings server={server} apiKey={ptApiKey} />
                            }
                        />
                    </div>

                    {/* Desktop Sidebar - Charts + Stats */}
                    <aside className="hidden md:flex md:col-span-4 flex-col gap-3">
                        {DesktopSidebar}
                    </aside>
                </div>
            </div>
        </TooltipProvider>
    );
}

export default GameDashboard;
