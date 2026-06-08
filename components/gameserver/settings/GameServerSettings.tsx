'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameServer } from '@/models/gameServerModel';
import { Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import ReinstallDialog from './ReinstallDialog';
import DeleteFreeServerModal from './DeleteFreeServerModal';
import GameSpecificSettings from './gameSpecific/settings/GameSpecificSettings';
import ActionItem from './ActionItem';
import { useTranslations } from 'next-intl';
import { GeneralServerSettings } from './generalSettings/GeneralServerSettings';

interface GameServerSettingsProps {
    server: GameServer;
    apiKey: string;
}

export default function GameServerSettings({ server, apiKey }: GameServerSettingsProps) {
    const t = useTranslations('gameserverSettings');

    return (
        <div className="min-h-72">
            <div className="space-y-3">
                {/* Server Settings Card */}
                <GeneralServerSettings server={server} />

                <GameSpecificSettings server={server} apiKey={apiKey} />

                {/* Server Management Section */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-0 p-3">
                        <CardTitle className="text-base">{t('management.title')}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {t('management.description')}
                        </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                        <div className="space-y-4">
                            <ActionItem
                                title={t('management.reinstall.title')}
                                description={t('management.reinstall.description')}
                            >
                                <ReinstallDialog server_id={server.identifier} />
                            </ActionItem>

                            <ActionItem
                                title={t('management.changeGame.title')}
                                description={t('management.changeGame.description')}
                            >
                                <Button asChild variant="destructive" className="w-full">
                                    <Link href={`/gameserver/${server.identifier}/changeGame`}>
                                        <Gamepad2 className="h-4 w-4 mr-2" />
                                        {t('management.changeGame.button')}
                                    </Link>
                                </Button>
                            </ActionItem>

                            {/* Delete Free Server (only for free servers) */}
                            {server.type === 'FREE' && (
                                <ActionItem
                                    title={t('management.deleteFreeServerAction.title')}
                                    description={t('management.deleteFreeServerAction.description')}
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
