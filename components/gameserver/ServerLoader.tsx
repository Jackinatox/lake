'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { useConnectionState } from '@/hooks/useServerWebSocket';
import { GameServer } from '@/models/gameServerModel';
import { Check, Loader2, Monitor, Server, Wifi } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import GameDashboard from './Console/gameDashboard';
import { on as onServerEvent } from './serverEvents';
import { GameServerType } from '@/app/client/generated/enums';
import { EggFeature } from '@/app/client/generated/browser';

interface ServerLoaderProps {
    serverId: string;
    ptApiKey: string;
    baseUrl: string;
    initialServer: {
        egg_id: number;
        gameSlug: string;
        gameDataId: number;
        gameData: any;
        type: GameServerType;
        expires: Date;
    };
    features: EggFeature[];
}

export default function ServerLoader({
    serverId,
    ptApiKey,
    baseUrl,
    initialServer,
    features,
}: ServerLoaderProps) {
    const [server, setServer] = useState<GameServer | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const t = useTranslations();

    const fetchServerData = useCallback(async () => {
        try {
            const response = await fetch(`${baseUrl}/api/client/servers/${serverId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 403 || response.status === 404) {
                    setError(t('gameserver.serverNotFoundAccess'));
                } else {
                    setError(t('gameserver.failedFetch'));
                }
                return;
            }

            const data = await response.json();
            const serverData = data.attributes;

            // Merge with initial server data
            const updatedServer: GameServer = {
                ...serverData,
                egg_id: initialServer.egg_id,
                gameSlug: initialServer.gameSlug,
                gameDataId: initialServer.gameDataId,
                gameData: initialServer.gameData,
                type: initialServer.type,
                expires: initialServer.expires,
            };

            setServer(updatedServer);
            setIsInstalling(!!serverData.is_installing);
            setIsRestoring(serverData.status === 'restoring_backup');
            setError(null);
        } catch (err) {
            console.error('Error fetching server data:', err);
            setError(t('gameserver.errorLoading'));
        } finally {
            setLoading(false);
        }
    }, [
        baseUrl,
        initialServer.egg_id,
        initialServer.expires,
        initialServer.gameData,
        initialServer.gameDataId,
        initialServer.gameSlug,
        initialServer.type,
        ptApiKey,
        serverId,
        t,
    ]);

    useEffect(() => {
        fetchServerData();
    }, [fetchServerData]);

    // Listen for manual restore/reinstall start/stop events from other components
    useEffect(() => {
        const offStart = onServerEvent('restore_started', (p) => {
            if (p?.serverId === serverId) {
                setIsRestoring(true);
                setLoading(false);
            }
        });

        const offStop = onServerEvent('restore_stopped', (p) => {
            if (p?.serverId === serverId) {
                // re-fetch immediately to pick up final state
                fetchServerData();
            }
        });

        const offReinstallStart = onServerEvent('reinstall_started', (p) => {
            if (p?.serverId === serverId) {
                // reinstall is treated the same as a fresh install
                setIsInstalling(true);
                setLoading(false);
            }
        });

        const offReinstallStop = onServerEvent('reinstall_stopped', (p) => {
            if (p?.serverId === serverId) {
                // re-fetch immediately to pick up final state
                fetchServerData();
            }
        });

        return () => {
            offStart();
            offStop();
            offReinstallStart();
            offReinstallStop();
        };
    }, [fetchServerData, serverId]);

    // Auto-refresh every 2 seconds while installing or restoring
    useEffect(() => {
        if (isInstalling || isRestoring) {
            const interval = setInterval(() => {
                fetchServerData();
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [fetchServerData, isInstalling, isRestoring]);

    if (error) {
        return (
            <div className="min-h-[60vh] pt-[20vh]">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-destructive">{t('gameserver.error')}</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (isInstalling && server) {
        return (
            <div className="min-h-[60vh] pt-[20vh]">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {t('gameserver.installation.title')}
                        </CardTitle>
                        <CardDescription>
                            {t.rich('gameserver.installation.description', {
                                serverName: server.name,
                                strong: (children) => <strong>{children}</strong>,
                            })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• {t('gameserver.installation.step1')}</p>
                            <p>• {t('gameserver.installation.step2')}</p>
                            <p>• {t('gameserver.installation.step3')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isRestoring && server) {
        return (
            <div className="min-h-[60vh] pt-[20vh]">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {t('gameserver.restore.title')}
                        </CardTitle>
                        <CardDescription>
                            {t.rich('gameserver.restore.description', {
                                serverName: server.name,
                                strong: (children) => <strong>{children}</strong>,
                            })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• {t('gameserver.restore.step1')}</p>
                            <p>• {t('gameserver.restore.step2')}</p>
                            <p>• {t('gameserver.restore.step3')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!server) {
        if (loading) {
            return <LoadingCard serverName={null} gameSlug={initialServer.gameSlug} />;
        }
        return (
            <div className="min-h-[60vh] pt-[20vh]">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-destructive">
                            {t('gameserver.serverNotFound')}
                        </CardTitle>
                        <CardDescription>{t('gameserver.serverNotFoundDesc')}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Wrap in WebSocketProvider so both the gate and the dashboard share the connection
    return (
        <WebSocketProvider serverId={server.identifier} apiKey={ptApiKey} debug>
            <WebSocketGate
                server={server}
                ptApiKey={ptApiKey}
                features={features}
                gameSlug={initialServer.gameSlug}
                loading={loading}
            />
        </WebSocketProvider>
    );
}

/**
 * Shows the loading screen until the WebSocket connection is established,
 * then renders the dashboard.
 */
function WebSocketGate({
    server,
    ptApiKey,
    features,
    gameSlug,
    loading: dataLoading,
}: {
    server: GameServer;
    ptApiKey: string;
    features: EggFeature[];
    gameSlug: string;
    loading: boolean;
}) {
    const { isConnected, isLoading: wsLoading } = useConnectionState();
    const [hasConnected, setHasConnected] = useState(false);

    useEffect(() => {
        if (isConnected) setHasConnected(true);
    }, [isConnected]);

    // Only show the loading card for the initial connection, not reconnects
    if (!hasConnected && (dataLoading || (!isConnected && wsLoading))) {
        return <LoadingCard serverName={server.name} gameSlug={gameSlug} />;
    }

    return (
        <div className="max-w-screen-2xl mx-auto">
            <GameDashboard server={server} ptApiKey={ptApiKey} features={features} />
        </div>
    );
}

/**
 * Enhanced loading card that shows server info and step progress.
 */
function LoadingCard({
    serverName,
    gameSlug,
}: {
    serverName: string | null;
    gameSlug: string;
}) {
    const t = useTranslations();

    const dataReady = serverName !== null;

    return (
        <div className="min-h-[60vh] pt-[20vh]">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('gameserver.loading')}
                    </CardTitle>
                    {serverName && (
                        <CardDescription className="flex items-center gap-2 pt-1">
                            <Server className="h-4 w-4" />
                            {serverName}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm">
                        <LoadingStep
                            icon={<Monitor className="h-4 w-4" />}
                            label={t('gameserver.loadingSteps.fetchingData')}
                            done={dataReady}
                        />
                        <LoadingStep
                            icon={<Wifi className="h-4 w-4" />}
                            label={t('gameserver.loadingSteps.connecting')}
                            done={false}
                            active={dataReady}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 capitalize">
                        {gameSlug.replace(/-/g, ' ')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function LoadingStep({
    icon,
    label,
    done,
    active,
}: {
    icon: React.ReactNode;
    label: string;
    done: boolean;
    active?: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-3 ${done ? 'text-foreground' : active ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
        >
            {done ? <Check className="h-4 w-4 text-emerald-500" /> : icon}
            <span>{label}</span>
            {!done && active && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
        </div>
    );
}
