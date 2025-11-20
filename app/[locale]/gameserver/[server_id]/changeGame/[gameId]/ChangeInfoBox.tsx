'use client';

import { Info, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ChangeInfoBox() {
    const t = useTranslations('changeGame');

    return (
        <div
            className={`flex items-start gap-3 rounded-lg border p-4 shadow-sm border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20`}
        >
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />

            <div className="space-y-1">
                <p className={`text-sm font-semibold text-blue-900 dark:text-blue-100`}>
                    {t('flavorChangeTitle')}
                </p>
                <p className={`text-sm text-blue-800 dark:text-blue-200`}>
                    {t('flavorChangeDesc')}
                </p>
            </div>
        </div>
    );
}
