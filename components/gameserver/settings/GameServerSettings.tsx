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
import MinecraftSettings from './gameSpecific/settings/MinecraftSettings';
import ActionItem from './ActionItem';
import { useTranslations } from 'next-intl';
import { GeneralServerSettings } from './generalSettings/GeneralServerSettings';

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

    const t = useTranslations('gameserverSettings');

    return (
        <div className="min-h-72">
            <div className="space-y-3">
                {/* Server Settings Card */}
                <GeneralServerSettings server={server} />

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
                        <CardTitle className="text-base">{t('management.title' as any)}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {t('management.description' as any)}
                        </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                        <div className="space-y-4">
                            <ActionItem
                                title={t('management.reinstall.title' as any)}
                                description={t('management.reinstall.description' as any)}
                            >
                                <ReinstallDialog apiKey={apiKey} server_id={server.identifier} />
                            </ActionItem>

                            <ActionItem
                                title={t('management.changeGame.title' as any)}
                                description={t('management.changeGame.description' as any)}
                            >
                                <Button asChild variant="destructive" className="w-full">
                                    <Link href={`/gameserver/${server.identifier}/changeGame`}>
                                        <Gamepad2 className="h-4 w-4 mr-2" />
                                        {t('management.changeGame.button' as any)}
                                    </Link>
                                </Button>
                            </ActionItem>

                            {/* Delete Free Server (only for free servers) */}
                            {server.type === 'FREE' && (
                                <ActionItem
                                    title={t('management.deleteFreeServerAction.title' as any)}
                                    description={t(
                                        'management.deleteFreeServerAction.description' as any,
                                    )}
                                >
                                    <DeleteFreeServerModal ptServerId={server.identifier} />
                                </ActionItem>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
