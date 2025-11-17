'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FreeServerUsageCardProps {
    userFreeServers: number;
    maxServers: number;
}

export default function FreeServerUsageCard({
    userFreeServers,
    maxServers,
}: FreeServerUsageCardProps) {
    const t = useTranslations('freeServer');
    const limitReached = userFreeServers >= maxServers;

    const cardClass = `mb-6 w-full max-w-lg md:max-w-3xl ${
        limitReached ? 'border-red-300 dark:border-red-800' : 'border-blue-300 dark:border-blue-800'
    }`;

    const innerClass = `flex items-center justify-between p-4 rounded-lg ${
        limitReached ? 'bg-red-50 dark:bg-red-950/20' : 'bg-blue-100 dark:bg-blue-950/50'
    }`;

    const iconColor = limitReached
        ? 'text-red-600 dark:text-red-400'
        : 'text-blue-600 dark:text-blue-400';

    const textColor = limitReached
        ? 'text-red-700 dark:text-red-400'
        : 'text-blue-700 dark:text-blue-400';

    const countColor = limitReached
        ? 'text-red-600 dark:text-red-400'
        : 'text-blue-600 dark:text-blue-400';

    return (
        <div className="flex justify-center w-full">
            <Card className={cardClass}>
                <CardContent className="p-0">
                    <div className={innerClass}>
                        <div className="flex items-center gap-3">
                            {limitReached ? (
                                <AlertCircle className={`h-6 w-6 ${iconColor}`} />
                            ) : (
                                <CheckCircle className={`h-6 w-6 ${iconColor}`} />
                            )}
                            <div>
                                <p className={`font-semibold ${textColor}`}>
                                    {t('serverUsageTitle')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {limitReached ? t('limitReached') : t('serverUsageDescription')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-3xl font-bold ${countColor}`}>
                                {userFreeServers}/{maxServers}
                            </p>
                            <p className="text-xs text-muted-foreground">{t('serversLabel')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
