'use client';

import { AlertTriangle, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface FilesWarningProps {
    deleteFiles: boolean;
}

export default function FilesWarning({ deleteFiles }: FilesWarningProps) {
    const t = useTranslations('changeGame');

    if (deleteFiles) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive shadow-sm dark:border-destructive/60 dark:bg-destructive/25 dark:text-destructive-foreground dark:shadow-[0_0_24px_rgba(239,68,68,0.25)]">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive dark:text-destructive-foreground" />
                <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-wide text-destructive dark:text-destructive-foreground">
                        {t('filesDeletedTitle')}
                    </p>
                    <p className="text-sm text-destructive/80 dark:text-destructive-foreground/90">
                        {t('filesDeletedDesc')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {t('filesKeptTitle')}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">{t('filesKeptDesc')}</p>
            </div>
        </div>
    );
}
