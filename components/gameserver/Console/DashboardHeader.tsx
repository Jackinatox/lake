'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GameServer } from '@/models/gameServerModel';
import { ChevronDown, Gauge, Play, Power, RefreshCw, Square, Zap } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { StatusIndicator } from './StatusIndicator';
import { CompactServerAddress } from './CompactServerAddress';
import GameInfo from '../settings/gameSpecific/info/GameInfo';

interface DashboardHeaderProps {
    server: GameServer;
    ptApiKey: string;
    serverStatus: string | null;
    loading: boolean;
    isConnected: boolean;
    onPowerAction: (action: 'start' | 'stop' | 'restart' | 'kill') => void;
}

// Separate PowerControls component defined outside
interface PowerControlsProps {
    isRunning: boolean;
    isOffline: boolean;
    loading: boolean;
    serverStatus: string | null;
    onPowerAction: (action: 'start' | 'stop' | 'restart' | 'kill') => void;
}

function PowerControls({
    isRunning,
    isOffline,
    loading,
    serverStatus,
    onPowerAction,
}: PowerControlsProps) {
    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={isRunning ? 'outline' : 'default'}
                        size="icon"
                        onClick={() => onPowerAction('start')}
                        disabled={
                            loading ||
                            isRunning ||
                            serverStatus === 'stopping' ||
                            serverStatus === 'starting'
                        }
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
                        onClick={() => onPowerAction('stop')}
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
                        onClick={() => onPowerAction('restart')}
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
                        onClick={() => onPowerAction('kill')}
                        disabled={loading || isOffline}
                        className="h-8 w-8"
                    >
                        <Power className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Kill</TooltipContent>
            </Tooltip>
        </>
    );
}

// Separate MobilePowerDropdown component defined outside
interface MobilePowerDropdownProps {
    isRunning: boolean;
    isOffline: boolean;
    loading: boolean;
    serverStatus: string | null;
    onPowerAction: (action: 'start' | 'stop' | 'restart' | 'kill') => void;
}

function MobilePowerDropdown({
    isRunning,
    isOffline,
    loading,
    serverStatus,
    onPowerAction,
}: MobilePowerDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 px-2">
                    <Zap className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => onPowerAction('start')}
                    disabled={
                        loading ||
                        isRunning ||
                        serverStatus === 'stopping' ||
                        serverStatus === 'starting'
                    }
                    className="gap-2"
                >
                    <Play className="h-4 w-4 text-green-500" />
                    Start
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onPowerAction('stop')}
                    disabled={loading || isOffline}
                    className="gap-2"
                >
                    <Square className="h-4 w-4" />
                    Stop
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onPowerAction('restart')}
                    disabled={loading || isOffline}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Restart
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => onPowerAction('kill')}
                    disabled={loading || isOffline}
                    className="gap-2 text-destructive focus:text-destructive"
                >
                    <Power className="h-4 w-4" />
                    Kill
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * DashboardHeader - Responsive header bar for the game server dashboard
 *
 * Layout strategy:
 * - Mobile (<640px): Status dot + Power dropdown + Upgrade button (single row)
 * - Tablet (640-1024px): Server name (truncated) + Status + Address dropdown + Controls
 * - Desktop (>1024px): Full layout with all elements visible
 */
export function DashboardHeader({
    server,
    ptApiKey,
    serverStatus,
    loading,
    isConnected,
    onPowerAction,
}: DashboardHeaderProps) {
    const t = useTranslations();
    const pathname = usePathname();

    // Get allocation info
    const allocations = server.relationships.allocations.data.map((a) => a.attributes);
    const defAlloc = allocations.find((alloc) => alloc.is_default);
    const address = defAlloc?.ip_alias || defAlloc?.ip || '';
    const port = defAlloc?.port || 0;

    const isOffline = serverStatus === 'unknown' || serverStatus === 'offline' || !isConnected;
    const isRunning = serverStatus === 'running';

    return (
        <Card className="sticky top-0 z-20 shadow-sm bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
            <CardContent className="p-1 sm:p-2 md:p-3">
                {/* Mobile Layout: Status dot + controls + upgrade */}
                <div className="flex md:hidden items-center justify-between gap-1">
                    {/* Left: Status indicator + server name (truncated) */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <StatusIndicator state={serverStatus} size="sm" showTooltip />
                        <h1 className="text-xs font-semibold truncate">{server.name}</h1>
                    </div>

                    {/* Right: Power dropdown + Upgrade */}
                    <div className="flex items-center gap-1 shrink-0">
                        {address && port && (
                            <CompactServerAddress
                                address={address}
                                port={port}
                                eggId={server.egg_id}
                                allocations={allocations}
                                compact
                            />
                        )}
                        <MobilePowerDropdown
                            isRunning={isRunning}
                            isOffline={isOffline}
                            loading={loading}
                            serverStatus={serverStatus}
                            onPowerAction={onPowerAction}
                        />
                        <Button asChild variant="outline" size="sm" className="h-8 px-2">
                            <Link href={`${pathname}/upgrade`}>
                                <Gauge className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Tablet/Desktop Layout */}
                <div className="hidden md:flex items-center justify-between gap-2">
                    {/* Left section: Server name + Status */}
                    <div className="flex items-center gap-2 min-w-0 shrink">
                        <h1 className="text-sm font-bold truncate">{server.name}</h1>
                        {/* Status label - hidden on smaller screens to give name more space */}
                        <div className="hidden lg:block shrink-0">
                            <StatusIndicator
                                state={serverStatus}
                                showLabel
                                size="sm"
                                showTooltip={false}
                            />
                        </div>
                        {/* Status dot only on medium screens */}
                        <div className="lg:hidden shrink-0">
                            <StatusIndicator
                                state={serverStatus}
                                showLabel={false}
                                size="sm"
                                showTooltip
                            />
                        </div>
                    </div>

                    {/* Center section: Address + Game Info (flexible width) */}
                    <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                        {/* Game Info - hidden on smaller tablets */}
                        <div className="hidden xl:block shrink-0">
                            <GameInfo server={server} apiKey={ptApiKey} />
                        </div>

                        {/* Server Address */}
                        {address && port ? (
                            <div className="bg-muted/50 rounded border px-1.5 py-0.5">
                                <CompactServerAddress
                                    address={address}
                                    port={port}
                                    eggId={server.egg_id}
                                    allocations={allocations}
                                />
                            </div>
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                {t('gameserver.dashboard.noAllocation')}
                            </span>
                        )}
                    </div>

                    {/* Right section: Power controls + Upgrade (fixed width, never wraps) */}
                    <div className="flex items-center gap-1 shrink-0">
                        {/* Power buttons - show at lg breakpoint */}
                        <div className="hidden lg:flex items-center gap-0.5">
                            <PowerControls
                                isRunning={isRunning}
                                isOffline={isOffline}
                                loading={loading}
                                serverStatus={serverStatus}
                                onPowerAction={onPowerAction}
                            />
                        </div>

                        {/* Power dropdown for medium screens */}
                        <div className="lg:hidden">
                            <MobilePowerDropdown
                                isRunning={isRunning}
                                isOffline={isOffline}
                                loading={loading}
                                serverStatus={serverStatus}
                                onPowerAction={onPowerAction}
                            />
                        </div>

                        {/* Upgrade button - matches power button height */}
                        <Button asChild variant="outline" size="sm" className="h-8 px-2 text-xs">
                            <Link href={`${pathname}/upgrade`}>
                                {t('gameserver.dashboard.header.upgrade')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
