'use client';

import { FabricEggId, ForgeEggId, PaperEggId, VanillaEggId } from '@/app/GlobalConstants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameServer } from '@/models/gameServerModel';
import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import ReinstallDialog from './ReinstallDialog';
import ServerSettingsCard from './ServerSettingsCard';
import MinecraftSettings from './gameSpecific/settings/MinecraftSettings';

interface GameServerSettingsProps {
    server: GameServer;
    apiKey: string;
}

export default function GameServerSettings({ server, apiKey }: GameServerSettingsProps) {
    const isMinecraftServer = [PaperEggId, VanillaEggId, ForgeEggId, FabricEggId].includes(
        server.egg_id,
    );

    return (
        <div className="w-full mx-auto">
            <div className="space-y-4 sm:space-y-6">
                {/* Server Settings Card */}
                <div className="w-full">
                    <ServerSettingsCard server={server} />
                </div>

                {/* Game-Specific Settings */}
                {isMinecraftServer && (
                    <Card className="w-full">
                        <CardHeader className="pb-0 md:pb-0">
                            <CardTitle className="flex items-center gap-2">
                                <Gamepad2 className="h-5 w-5" />
                                Game-Specific Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="">
                            <MinecraftSettings server={server} apiKey={apiKey} />
                        </CardContent>
                    </Card>
                )}

                {/* Server Management Section */}
                <Card className="w-full">
                    <CardHeader className="pb-0 md:pb-0">
                        <CardTitle className="text-lg sm:text-xl">Server Management</CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            These actions can affect your server's functionality. Please use with
                            caution.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="w-full sm:w-1/2">
                                    <ReinstallDialog
                                        apiKey={apiKey}
                                        server_id={server.identifier}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <Button asChild className="w-full" variant="destructive">
                                        <Link href={`/gameserver/${server.identifier}/changeGame`}>
                                            <Gamepad2 className="h-4 w-4 mr-2" />
                                            Change game
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
