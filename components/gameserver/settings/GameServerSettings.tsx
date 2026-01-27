'use client';

import {
    FabricEggId,
    ForgeEggId,
    NeoForgeEggId,
    PaperEggId,
    VanillaEggId,
} from '@/app/GlobalConstants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameServer } from '@/models/gameServerModel';
import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import ReinstallDialog from './ReinstallDialog';
import DeleteFreeServerModal from './DeleteFreeServerModal';
import ServerSettingsCard from './ServerSettingsCard';
import MinecraftSettings from './gameSpecific/settings/MinecraftSettings';

interface GameServerSettingsProps {
    server: GameServer;
    apiKey: string;
}

export default function GameServerSettings({ server, apiKey }: GameServerSettingsProps) {
    const isMinecraftServer = [
        PaperEggId,
        VanillaEggId,
        ForgeEggId,
        FabricEggId,
        NeoForgeEggId,
    ].includes(server.egg_id);

    return (
        <div className="min-h-72">
            <div className="space-y-3">
                {/* Server Settings Card */}
                <ServerSettingsCard server={server} />

                {/* Game-Specific Settings */}
                {isMinecraftServer && (
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-0 p-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Gamepad2 className="h-5 w-5" />
                                Game-Specific Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-2">
                            <MinecraftSettings server={server} apiKey={apiKey} />
                        </CardContent>
                    </Card>
                )}

                {/* Server Management Section */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-0 p-3">
                        <CardTitle className="text-base">Server Management</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            These actions can affect your server&apos;s functionality. Please use with
                            caution.
                        </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                        <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="w-full sm:w-1/2">
                                    <ReinstallDialog
                                        apiKey={apiKey}
                                        server_id={server.identifier}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <Button asChild className="w-full border border-red-600 bg-red-600/20" variant="secondary">
                                        <Link href={`/gameserver/${server.identifier}/changeGame`}>
                                            <Gamepad2 className="h-4 w-4 mr-2" />
                                            Change game
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            {/* Delete Free Server (only for free servers) */}
                            {server.type === 'FREE' && (
                                <DeleteFreeServerModal ptServerId={server.identifier} />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
