'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GameServer } from '@/models/gameServerModel';
import { Save, Server } from 'lucide-react';
import { useState } from 'react';
import { renameClientServer } from './serverSettingsActions';

export interface ServerSettingsCardProps {
    server: GameServer;
}

export default function ServerSettingsCard({ server }: ServerSettingsCardProps) {
    const [serverName, setServerName] = useState(server.name);
    const { toast } = useToast();

    const handleSaveServerName = async () => {
        if (await renameClientServer(server.identifier, serverName)) {
            toast({
                title: 'Server name updated',
                description: 'The server name has been successfully updated.',
                variant: 'default',
            });
            // eslint-disable-next-line react-hooks/immutability
            server.name = serverName;
        } else {
            toast({
                title: 'Server name updated failed',
                description: 'The server name update has failed',
                variant: 'destructive',
            });
        }
    };
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
            <CardContent className="p-3 pt-2">
                {/* Server Name */}
                <div className="space-y-2">
                    <Label htmlFor="server-name">Server Name</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <ButtonGroup className="flex-1 w-full">
                            <Input
                                id="server-name"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                placeholder="Enter server name"
                                maxLength={64}
                            />
                            <Button
                                variant="outline"
                                onClick={handleSaveServerName}
                                disabled={serverName === server.name || serverName.trim() === ''}
                                className="flex items-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                <span>Save</span>
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
