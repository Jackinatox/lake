'use client';

import { cn } from '@/lib/utils';
import { Archive, HardDrive, Network } from 'lucide-react';
import type { ResourceTierDisplay } from './PerformanceConfigurator';
import { useTranslations } from 'next-intl';

interface ResourceTierSelectorProps {
    tiers: ResourceTierDisplay[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}

export default function ResourceTierSelector({
    tiers,
    selectedId,
    onSelect,
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
            {tiers.map((tier) => (
                <button
                    key={tier.id}
                    type="button"
                    onClick={() => onSelect(tier.id)}
                    className={cn(
                        'rounded-lg border cursor-pointer transition-colors text-left',
                        selectedId === tier.id
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border hover:bg-muted/50',
                    )}
                >
                    {/* Mobile: horizontal layout */}
                    <div className="flex items-center gap-3 p-2.5 sm:hidden">
                        {/* Price */}
                        <div className="shrink-0 w-16 text-center">
                            {tier.priceCents > 0 ? (
                                <span className="text-sm font-semibold tabular-nums">
                                    +{(tier.priceCents / 100).toFixed(2)} €
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

                    {/* Desktop: vertical layout */}
                    <div className="hidden sm:flex flex-col p-3">
                        {tier.name && (
                            <div className="text-xs font-medium text-muted-foreground mb-3">
                                {tier.name}
                            </div>
                        )}
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
                            <StatRow icon={Network} label={t('ports')} value={String(tier.ports)} />
                        </div>
                        <div className="mt-3 pt-3 border-t border-border">
                            {tier.priceCents > 0 ? (
                                <span className="text-base font-semibold tabular-nums">
                                    +{(tier.priceCents / 100).toFixed(2)} €
                                </span>
                            ) : (
                                <span className="text-base font-semibold text-green-600 dark:text-green-400">
                                    {t('free')}
                                </span>
                            )}
                        </div>
                    </div>
                </button>
            ))}
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
