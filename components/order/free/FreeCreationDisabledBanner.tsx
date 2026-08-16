import { useTranslations } from 'next-intl';
import { PauseCircle } from 'lucide-react';

/**
 * Explains to the user why no new free servers can be created right now —
 * either the `free_server_creation_enabled` kill switch is off, or the free
 * server limit is configured to 0.
 */
export default function FreeCreationDisabledBanner({ className }: { className?: string }) {
    const t = useTranslations('freeServer.creationDisabled');

    return (
        <div
            className={`rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 ${className ?? ''}`}
        >
            <div className="flex items-start gap-3">
                <PauseCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{t('title')}</p>
                    <p className="text-sm text-muted-foreground">{t('description')}</p>
                </div>
            </div>
        </div>
    );
}
