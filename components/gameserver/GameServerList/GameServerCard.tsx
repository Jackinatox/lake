'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ClientServer } from '@/models/prisma';
import { Calendar, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import GameServerStatus from './GameServerStatus';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

function formatExpirationDate(date: Date) {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format: "15.01.2025 14:30"
    const formattedDate = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    if (diffDays < 0) {
        return { text: 'Expired', color: 'text-red-600 dark:text-red-400' };
    } else if (diffDays <= 7) {
        return {
            text: `${formattedDate} ${formattedTime}`,
            color: 'text-orange-600 dark:text-orange-400',
        };
    } else if (diffDays <= 30) {
        return {
            text: `${formattedDate} ${formattedTime}`,
            color: 'text-yellow-600 dark:text-yellow-400',
        };
    } else {
        return {
            text: `${formattedDate} ${formattedTime}`,
            color: 'text-slate-600 dark:text-slate-400',
        };
    }
}

function ServerCard({ server, apiKey }: { server: ClientServer; apiKey: string }) {
    const t = useTranslations('gameserver');
    const expiration =
        server.status === 'EXPIRED'
            ? { text: 'Expired', color: 'text-red-600 dark:text-red-400' }
            : formatExpirationDate(server.expires);

    const isCreationFailed = server.status === 'CREATION_FAILED';

    return (
        <Card className={`group hover:shadow-md transition-all duration-300 shadow-sm ${
            isCreationFailed ? 'border-2 border-red-500 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20' : ''
        }`}>
            <Link
                href={`/gameserver/${server.ptServerId}${server.status === 'EXPIRED' && '/upgrade'}`}
            >
                <CardContent className="p-3 sm:p-6">
                    {/* Mobile layout: compact stacked design */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        {/* Top row on mobile: icon + name + status */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            {/* Game icon */}
                            <div className="shrink-0">
                                <span className="block dark:hidden">
                                    <Image
                                        src={`/images/light/games/icons/${server.gameData.name.toLowerCase()}.webp`}
                                        alt={`${server.gameData.name} icon`}
                                        width={64}
                                        height={64}
                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
                                        priority
                                    />
                                </span>
                                <span className="hidden dark:block">
                                    <Image
                                        src={`/images/dark/games/icons/${server.gameData.name.toLowerCase()}.webp`}
                                        alt={`${server.gameData.name} icon (dark mode)`}
                                        width={64}
                                        height={64}
                                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
                                        priority
                                    />
                                </span>
                            </div>

                            {/* Server info */}
                            <div className="flex-1 min-w-0">
                                {/* Name row with status */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-lg sm:text-xl text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                        {server.name}
                                    </h3>
                                    <GameServerStatus apiKey={apiKey} server={server} />
                                    {server.type === 'FREE' && (
                                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-2 py-0.5 text-xs font-bold shadow-sm">
                                            ✨ {t('freeServer')}
                                        </Badge>
                                    )}
                                    {isCreationFailed && (
                                        <Badge className="bg-red-600 text-white border-0 px-2 py-0.5 text-xs font-bold shadow-sm animate-pulse">
                                            ⚠️ {t('creationFailed')}
                                        </Badge>
                                    )}
                                </div>

                                {/* Creation failed message */}
                                {isCreationFailed && (
                                    <div className="mt-1 text-sm text-red-700 dark:text-red-300 font-medium">
                                        {t('creationFailedMessage')}
                                    </div>
                                )}

                                {/* Specs row - compact on mobile */}
                                <div className="flex items-center gap-4 sm:gap-5 mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Cpu className="w-4 h-4 text-blue-500" />
                                        <span>{server.cpuPercent / 100}</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MemoryStick className="w-4 h-4 text-purple-500" />
                                        <span>{server.ramMB / 1024}GB</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <HardDrive className="w-4 h-4 text-green-500" />
                                        <span>{server.diskMB / 1024}GB</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Expiration - inline on mobile */}
                        <div className="flex items-center gap-2 text-sm sm:shrink-0 pl-15 sm:pl-0">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className={`font-medium ${expiration.color}`}>
                                {expiration.text}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}

export default ServerCard;
