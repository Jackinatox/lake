'use client';

import { cn } from '@/lib/utils';
import { ResourceTierDisplay } from '@/models/prisma';
import { Archive, HardDrive, Network } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ResourceTierSelectorProps {
    tiers: ResourceTierDisplay[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    /** Selected duration in days — used to prorate the displayed price */
    days?: number;
    currentDiskUsageMb?: number;
    persistedTierId?: number | null;
}

export default function ResourceTierSelector({
    tiers,
    selectedId,
    onSelect,
    days = 30,
    currentDiskUsageMb = 0,
    persistedTierId = null,
}: ResourceTierSelectorProps) {
    const t = useTranslations('order.resourceTier');
    if (tiers.length === 0) return null;

    return (
        <div
            className={cn(
                'grid gap-2',
                tiers.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3',
            )}
        >
            {tiers.map((tier) => {
                const isPersistedTier = persistedTierId === tier.id;
                const exceedsDiskUsage = tier.diskMB < currentDiskUsageMb;
                const selectable = (tier.enabled || isPersistedTier) && !exceedsDiskUsage;
                const unavailableReason = exceedsDiskUsage
                    ? t('diskUsageExceeded', {
                          usedGiB: (Math.ceil((currentDiskUsageMb / 1024) * 10) / 10).toFixed(1),
                      })
                    : !tier.enabled && !isPersistedTier
                      ? t('unavailable')
                      : null;

                return (
                    <button
                        key={tier.id}
                        type="button"
                        disabled={!selectable}
                        onClick={() => {
                            if (selectable) onSelect(tier.id);
                        }}
                        className={cn(
                            'rounded-lg border transition-colors text-left',
                            selectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
                            selectedId === tier.id
                                ? 'border-primary/60 bg-primary/5'
                                : 'border-border hover:bg-muted/50 disabled:hover:bg-transparent',
                        )}
                    >
                        {/* Mobile: horizontal layout */}
                        <div className="flex items-center gap-3 p-2.5 sm:hidden">
                            {/* Price */}
                            <div className="shrink-0 w-16 text-center">
                                {tier.priceCents > 0 ? (
                                    <span className="text-sm font-semibold tabular-nums">
                                        {(Math.round((tier.priceCents / 30) * days) / 100).toFixed(
                                            2,
                                        )}{' '}
                                        €
                                    </span>
                                ) : (
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                        {t('free')}
                                    </span>
                                )}
                                {tier.name && (
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {tier.name}
                                    </div>
                                )}
                                {isPersistedTier && !tier.enabled && (
                                    <div className="mt-1 text-[10px] font-medium text-amber-600">
                                        {t('legacySelected')}
                                    </div>
                                )}
                            </div>
                            <div className="w-px self-stretch bg-border" />
                            {/* Stats inline */}
                            <div className="flex flex-1 items-center justify-around gap-2">
                                <MiniStat
                                    icon={HardDrive}
                                    value={`${tier.diskMB / 1024} GiB`}
                                    label={t('disk')}
                                />
                                <MiniStat
                                    icon={Archive}
                                    value={String(tier.backups)}
                                    label={t('backups')}
                                />
                                <MiniStat
                                    icon={Network}
                                    value={String(tier.ports)}
                                    label={t('ports')}
                                />
                            </div>
                        </div>
                        {(unavailableReason || (isPersistedTier && !tier.enabled)) && (
                            <div className="px-2.5 pb-2 text-[11px] text-muted-foreground sm:hidden">
                                {unavailableReason ?? t('legacyDescription')}
                            </div>
                        )}

                        {/* Desktop: vertical layout */}
                        <div className="hidden sm:flex flex-col p-3">
                            <div className="mb-3 flex items-start justify-between gap-2">
                                {tier.name && (
                                    <div className="text-xs font-medium text-muted-foreground">
                                        {tier.name}
                                    </div>
                                )}
                                {isPersistedTier && !tier.enabled && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                        {t('legacySelected')}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                <StatRow
                                    icon={HardDrive}
                                    label={t('disk')}
                                    value={`${tier.diskMB / 1024} GiB`}
                                />
                                <StatRow
                                    icon={Archive}
                                    label={t('backups')}
                                    value={String(tier.backups)}
                                />
                                <StatRow
                                    icon={Network}
                                    label={t('ports')}
                                    value={String(tier.ports)}
                                />
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                                {tier.priceCents > 0 ? (
                                    <span className="text-base font-semibold tabular-nums">
                                        {(Math.round((tier.priceCents / 30) * days) / 100).toFixed(
                                            2,
                                        )}{' '}
                                        €
                                    </span>
                                ) : (
                                    <span className="text-base font-semibold text-green-600 dark:text-green-400">
                                        {t('free')}
                                    </span>
                                )}
                            </div>
                            {unavailableReason && (
                                <div className="mt-2 text-xs text-amber-700">
                                    {unavailableReason}
                                </div>
                            )}
                            {!unavailableReason && isPersistedTier && !tier.enabled && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                    {t('legacyDescription')}
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function MiniStat({
    icon: Icon,
    value,
    label,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    label: string;
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <Icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">{value}</span>
            <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
    );
}

function StatRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{label}</span>
            </div>
            <span className="font-medium">{value}</span>
        </div>
    );
}
