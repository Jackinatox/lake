'use client';

import type React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, HardDrive, Network, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface TabsComponentProps {
    consoleComponent: React.ReactNode;
    fileManagerComponent: React.ReactNode;
    networkControlComponent?: React.ReactNode;
    backupManagerComponent?: React.ReactNode;
    settingsComponent?: React.ReactNode;
}

export function TabsComponent({
    consoleComponent,
    fileManagerComponent,
    networkControlComponent,
    backupManagerComponent,
    settingsComponent,
}: TabsComponentProps) {
    const [activeTab, setActiveTab] = useState('console');
    const t = useTranslations();

    return (
        <Tabs defaultValue="console" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 min-w-0">
                <TabsTrigger value="console" className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('gameserver.tabs.console')}</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('gameserver.tabs.files')}</span>
                </TabsTrigger>
                <TabsTrigger
                    value="network"
                    className="flex items-center gap-2"
                    disabled={!networkControlComponent}
                >
                    <Network className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('gameserver.tabs.network')}</span>
                </TabsTrigger>
                <TabsTrigger
                    value="backups"
                    className="flex items-center gap-2"
                    disabled={!backupManagerComponent}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M7 3v18" />
                        <path d="M3 7h18" />
                        <path d="m15 14-3 3 3 3" />
                        <path d="M18 14h-6v6" />
                    </svg>
                    <span className="hidden sm:inline">{t('gameserver.tabs.backups')}</span>
                </TabsTrigger>
                <TabsTrigger
                    value="settings"
                    className="flex items-center gap-2"
                    disabled={!settingsComponent}
                >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('gameserver.tabs.settings')}</span>
                </TabsTrigger>
            </TabsList>
            <TabsContent value="console" className="mt-3">
                <div className="w-full min-w-0">{consoleComponent}</div>
            </TabsContent>
            <TabsContent value="files" className="mt-3">
                <div className="w-full min-w-0">{fileManagerComponent}</div>
            </TabsContent>
            <TabsContent value="network" className="mt-3">
                <div className="w-full min-w-0">
                    {networkControlComponent || (
                        <div className="text-center py-8">{t('gameserver.tabs.networkComingSoon')}</div>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="backups" className="mt-3">
                <div className="w-full min-w-0">
                    {backupManagerComponent || (
                        <div className="text-center py-8">{t('gameserver.tabs.backupsComingSoon')}</div>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="settings" className="mt-3">
                <div className="w-full min-w-0">
                    {settingsComponent || (
                        <div className="text-center py-8">
                            {t('gameserver.tabs.settingsComingSoon')}
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}
