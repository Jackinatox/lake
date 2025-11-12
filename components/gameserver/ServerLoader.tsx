"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GameServer } from '@/models/gameServerModel';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import GameDashboard from './Console/gameDashboard';

interface ServerLoaderProps {
    serverId: string;
    ptApiKey: string;
    baseUrl: string;
    initialServer: {
        egg_id: number;
        gameDataId: number;
        gameData: any;
    };
}

export default function ServerLoader({ serverId, ptApiKey, baseUrl, initialServer }: ServerLoaderProps) {
    const [server, setServer] = useState<GameServer | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const t = useTranslations();

    const fetchServerData = async () => {
        try {
            const response = await fetch(
                `${baseUrl}/api/client/servers/${serverId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${ptApiKey}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                if (response.status === 403 || response.status === 404) {
                    setError('Server not found or access denied');
                } else {
                    setError('Failed to fetch server data');
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
                gameData: initialServer.gameData
            };

            setServer(updatedServer);
            setIsInstalling(serverData.is_installing);
            setError(null);
        } catch (err) {
            console.error('Error fetching server data:', err);
            setError('An error occurred while loading server data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServerData();
    }, []);

    // Auto-refresh every 2 seconds while installing
    useEffect(() => {
        if (isInstalling) {
            const interval = setInterval(() => {
                fetchServerData();
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [isInstalling]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading Server...
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
                        <CardTitle className="text-destructive">Error</CardTitle>
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
                            Server Installation in Progress
                        </CardTitle>
                        <CardDescription>
                            Your server <strong>{server.name}</strong> is currently being installed.
                            This page will automatically refresh and redirect you to the dashboard once the installation is complete.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• Installing dependencies and game files</p>
                            <p>• Configuring server settings</p>
                            <p>• This usually takes 1-3 minutes</p>
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
                        <CardTitle className="text-destructive">Server Not Found</CardTitle>
                        <CardDescription>Unable to load server data</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className='flex justify-center'>
            <div className='max-w-screen-2xl'>
                <GameDashboard server={server} ptApiKey={ptApiKey} />
            </div>
        </div>
    );
}
