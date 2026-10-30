import { isMaintenanceMode } from '@/lib/maintenance';
import { ShieldAlert } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/** Site-wide notice shown above every page while `MAINTENANCE_MODE` is on. */
export default async function MaintenanceBanner() {
    if (!isMaintenanceMode()) return null;

    const t = await getTranslations('Maintenance');

    return (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{t('bannerTitle')}</p>
                    <p className="text-sm text-muted-foreground">
                        {t('bannerDescription')}{' '}
                        <Link href="/maintenance" className="underline font-medium text-foreground">
                            {t('bannerLink')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
