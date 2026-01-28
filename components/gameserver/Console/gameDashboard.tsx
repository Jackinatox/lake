'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GameServer } from '@/models/gameServerModel';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Clock,
    Cpu,
    HardDrive,
    MemoryStickIcon as Memory,
    Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { TabsComponent } from '../GameserverTabs';
import GameServerSettings from '../settings/GameServerSettings';
import GameInfo from '../settings/gameSpecific/info/GameInfo';
import ConsoleV2 from './ConsoleV2';
import CPUChart from './graphs/CPUChart';
import RAMChart from './graphs/RAMChart';
import { DashboardHeader } from './DashboardHeader';
import { useRouter, useSearchParams } from 'next/navigation';
import BackupManager from '../BackupManager/BackupManager';
import { formatMilliseconds } from '@/lib/formatTime';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import {
    useConnectionState,
    useServerStatus,
    useServerStats,
    useConsoleOutput,
    useSendCommand,
    useCustomEvent,
    useInitialContentLoaded,
} from '@/hooks/useServerWebSocket';
import { ConnectionStatusBanner } from '../ConnectionStatusBanner';
import DynamicFeatures from '@/components/gameserver/features/DynamicFeatures';
import { EggFeature } from '@/app/client/generated/browser';
import dynamic from 'next/dynamic';

interface serverProps {
    server: GameServer;
    ptApiKey: string;
    features: EggFeature[];
}

/**
 * GameDashboard - Wrapper component that provides WebSocket context
 */
function GameDashboard({ server, ptApiKey, features }: serverProps) {
    return (
        <WebSocketProvider serverId={server.identifier} apiKey={ptApiKey} debug>
            <GameDashboardContent server={server} ptApiKey={ptApiKey} features={features} />
            <DynamicFeatures features={features} />
        </WebSocketProvider>
    );
}

/**
 * GameDashboardContent - Inner component that consumes WebSocket context via hooks
 */
function GameDashboardContent({ server, ptApiKey, features }: serverProps) {
    const isMobile = useIsMobile();

    // WebSocket hooks - replacing the old useWebSocket hook
    const { wsState, isConnected, isReconnecting } = useConnectionState();
    const serverStatus = useServerStatus();
    const serverStats = useServerStats();
    const consoleOutput = useConsoleOutput();
    const initialContentLoaded = useInitialContentLoaded();
    const { sendCommand, sendPowerAction } = useSendCommand();

    const searchParams = useSearchParams();
    const autoStart = useRef(searchParams.get('start') === 'true');
    const router = useRouter();
    const t = useTranslations();

    // Helper to format bytes
    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GiB`;
    };

    // Wrapper functions for power actions
    const handleCommand = (command: string) => sendCommand(command);
    const handlePowerAction = (action: 'start' | 'stop' | 'restart' | 'kill') =>
        sendPowerAction(action);

    const loading = !isConnected && !initialContentLoaded;
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
                                {loading
                                    ? '—'
                                    : `${(((serverStats?.cpu_absolute ?? 0) / server.limits.cpu) * 100).toFixed(1)}%`}
                            </span>
                        </div>
                        <Progress
                            value={((serverStats?.cpu_absolute ?? 0) / server.limits.cpu) * 100}
                            className="bg-blue-500/20 [&>div]:bg-blue-500 [&>div]:rounded-full h-1.5"
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
                                {loading ? '—' : `${serverStats?.formated_memory}`}
                            </span>
                        </div>
                        <Progress
                            value={Math.min(
                                ((serverStats?.memory_bytes ?? 0) /
                                    (server.limits.memory * 1024 * 1024)) *
                                    100,
                                100,
                            )}
                            className="bg-purple-500/20 [&>div]:bg-purple-500 [&>div]:rounded-full h-1.5"
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
                                {loading ? '—' : `${serverStats?.formated_disk}`}
                            </span>
                        </div>
                        <Progress
                            value={Math.min(
                                ((serverStats?.disk_bytes ?? 0) /
                                    (server.limits.disk * 1024 * 1024)) *
                                    100,
                                100,
                            )}
                            className="bg-emerald-500/20 [&>div]:bg-emerald-500 [&>div]:rounded-full h-1.5"
                        />
                    </div>
                </div>

                {/* Bottom row: Uptime + Network */}
                <div className="flex items-center justify-between text-xs border-t pt-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-cyan-500" />
                            <span className="font-medium tabular-nums">
                                {loading
                                    ? '—'
                                    : formatMilliseconds(serverStats?.uptime_seconds ?? 0)}
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
                    <CPUChart
                        newData={{
                            cpu_absolute:
                                ((serverStats?.cpu_absolute || 0) / server.limits.cpu) * 100,
                        }}
                        cpuLimit={server.limits.cpu / 100}
                    />
                </CardContent>
            </Card>

            {/* RAM Chart */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-2 md:p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Memory className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">RAM</span>
                    </div>
                    <RAMChart
                        newData={{
                            memory_bytes: (serverStats?.memory_bytes || 0) / 1024 / 1024 / 1024,
                        }}
                        memoryLimit={server.limits.memory / 1024}
                    />
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
                                : `${formatBytes(serverStats?.disk_bytes ?? 0)}/${(server.limits.disk / 1024).toFixed(0)} GiB`}
                        </span>
                    </div>
                    <Progress
                        value={
                            ((serverStats?.disk_bytes ?? 0) / (server.limits.disk * 1024 * 1024)) *
                            100
                        }
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
                            {/* TODO: Format uptime nicely */}
                            {loading ? '—' : formatMilliseconds(serverStats?.uptime_seconds ?? 0)}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </>
    );

    // Console component - now full width in tab content
    const ConsoleComponent = (
        <Card className="border-0 shadow-sm min-h-72 w-full min-w-0 p-0">
            <CardContent className="p-0 md:p-2">
                <ConsoleV2
                    logs={consoleOutput}
                    handleCommand={handleCommand}
                    disabled={!isConnected}
                />
            </CardContent>
        </Card>
    );

    // Charts are now integrated into DesktopSidebar
    //TODO: properly

    const offliney = serverStatus === 'unknown' || serverStatus === 'offline' || !isConnected;

    return (
        <TooltipProvider>
            <div className="space-y-3">
                {/* Connection Status Banner - shows when disconnected/reconnecting */}
                <ConnectionStatusBanner />

                {/* New Responsive Header */}
                <DashboardHeader
                    server={server}
                    ptApiKey={ptApiKey}
                    serverStatus={serverStatus}
                    loading={loading}
                    isConnected={isConnected}
                    onPowerAction={handlePowerAction}
                />
                {/* Mobile Stats Card */}
                {isMobile && MobileStatsCard}
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-stretch">
                    {/* Main Content Area - Tabs */}
                    <div className="w-full md:col-span-8 min-w-0">
                        <TabsComponent
                            consoleComponent={ConsoleComponent}
                            fileManagerComponent={
                                <LazyFileManager server={server} apiKey={ptApiKey} />
                            }
                            backupManagerComponent={
                                <BackupManager server={server} apiKey={ptApiKey} />
                            }
                            settingsComponent={
                                <GameServerSettings server={server} apiKey={ptApiKey} />
                            }
                        />
                    </div>

                    {/* Desktop Sidebar - Charts + Stats */}
                    {!isMobile && (
                        <aside className="md:col-span-4 flex flex-col gap-3">
                            {DesktopSidebar}
                        </aside>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}

const LazyFileManager = dynamic(() => import('../FileManager/FileManager'), {
    loading: () => (
        <div
            role="status"
            aria-busy="true"
            className="p-4 w-full border rounded-md shadow-sm bg-background/50 animate-pulse"
        >
            <div className="text-sm text-muted-foreground">Loading file manager…</div>
        </div>
    ),
    ssr: false,
});

export default GameDashboard;
