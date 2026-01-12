'use client';

import type React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, HardDrive, Network, Settings, Archive } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
    const t = useTranslations('gameserver.tabs');

    const tabItems = [
        {
            value: 'console',
            icon: <HardDrive className="h-4 w-4 shrink-0" />,
            label: t('console'),
            component: consoleComponent,
            disabled: false,
        },
        {
            value: 'files',
            icon: <FileText className="h-4 w-4 shrink-0" />,
            label: t('files'),
            component: fileManagerComponent,
            disabled: false,
        },
        {
            value: 'network',
            icon: <Network className="h-4 w-4 shrink-0" />,
            label: t('network'),
            component: networkControlComponent,
            disabled: !networkControlComponent,
        },
        {
            value: 'backups',
            icon: <Archive className="h-4 w-4 shrink-0" />,
            label: t('backups'),
            component: backupManagerComponent,
            disabled: !backupManagerComponent,
        },
        {
            value: 'settings',
            icon: <Settings className="h-4 w-4 shrink-0" />,
            label: t('settings'),
            component: settingsComponent,
            disabled: !settingsComponent,
        },
    ];

    return (
        <Tabs defaultValue="console" className="w-full" onValueChange={setActiveTab}>
            {/* Tabs list - grid on all screen sizes */}
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                {tabItems.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={cn(
                            'flex items-center justify-center gap-1 px-1 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm',
                            'whitespace-nowrap',
                            'data-[state=active]:bg-background data-[state=active]:shadow-sm'
                        )}
                        disabled={tab.disabled}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* Tab content with proper spacing */}
            {tabItems.map((tab) => (
                <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="mt-3 sm:mt-4 focus-visible:outline-none focus-visible:ring-0"
                >
                    {tab.component || (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            {t('comingSoon')}
                        </div>
                    )}
                </TabsContent>
            ))}
        </Tabs>
    );
}
