import { GameServer } from '@/models/gameServerModel';
import React from 'react';
import { ServerNameChanger } from './ServerNameChanger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';
import ServerExpiersDisplay from './ServerExpiersDisplay';

export interface ServerSettingsCardProps {
    server: GameServer;
}

export function GeneralServerSettings({ server }: ServerSettingsCardProps) {
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-0 p-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Server className="h-5 w-5" />
                    Server Settings
                </CardTitle>
                <CardDescription className="text-sm">
                    Configure your game server settings
                </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-4">
                <ServerNameChanger server={server} />
                <ServerExpiersDisplay ptServerId={server.identifier} expiryDate={server.expires} />
            </CardContent>
        </Card>
    );
}
