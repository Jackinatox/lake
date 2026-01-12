'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GameServer } from '@/models/gameServerModel';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import GameDashboard from './Console/gameDashboard';
import { on as onServerEvent } from './serverEvents';
import { GameServerType } from '@/app/client/generated/enums';

interface ServerLoaderProps {
    serverId: string;
    ptApiKey: string;
    baseUrl: string;
    initialServer: {
        egg_id: number;
        gameDataId: number;
        gameData: any;
        type: GameServerType;
    };
}

export default function ServerLoader({
    serverId,
    ptApiKey,
    baseUrl,
    initialServer,
}: ServerLoaderProps) {
    const [server, setServer] = useState<GameServer | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const t = useTranslations();

    const fetchServerData = async () => {
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
                gameDataId: initialServer.gameDataId,
                gameData: initialServer.gameData,
                type: initialServer.type,
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
    };

    useEffect(() => {
        fetchServerData();
    }, []);

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
    }, [serverId]);

    // Auto-refresh every 2 seconds while installing or restoring
    useEffect(() => {
        if (isInstalling || isRestoring) {
            const interval = setInterval(() => {
                fetchServerData();
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [isInstalling, isRestoring]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {t('gameserver.loading')}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Card className="w-full max-w-md">
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
            <div className="flex justify-center items-center min-h-[60vh]">
                <Card className="w-full max-w-md">
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
            <div className="flex justify-center items-center min-h-[60vh]">
                <Card className="w-full max-w-md">
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
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Card className="w-full max-w-md">
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

    return (
        <div className="flex justify-center">
            <div className="max-w-screen-2xl">
                <GameDashboard server={server} ptApiKey={ptApiKey} />
            </div>
        </div>
    );
}
