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
}

export default function ResourceTierSelector({
    tiers,
    selectedId,
    onSelect,
    days = 30,
}: ResourceTierSelectorProps) {
    const t = useTranslations('order.resourceTier');
    if (tiers.length === 0) return null;

    return (
        <div>
            {/* Mobile: table layout */}
            <div className="sm:hidden rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm table-fixed border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="w-1/4 text-center py-2 text-sm font-medium text-muted-foreground bg-muted/50 border-b border-border">
                                {t('disk')}
                            </th>
                            <th className="w-1/4 text-center py-2 text-sm font-medium text-muted-foreground bg-muted/50 border-b border-border">
                                {t('backups')}
                            </th>
                            <th className="w-1/4 text-center py-2 text-sm font-medium text-muted-foreground bg-muted/50 border-b border-border">
                                {t('ports')}
                            </th>
                            <th className="w-1/4" />
                        </tr>
                    </thead>
                    <tbody>
                        {tiers.map((tier, i) => {
                            const selected = selectedId === tier.id;
                            const prevSelected = i > 0 && selectedId === tiers[i - 1].id;
                            const showTopSep = i > 0 && !selected && !prevSelected;
                            // Always border-y so row height never changes — only color varies
                            const tdBase = cn(
                                'py-2.5 transition-colors border-y',
                                selected
                                    ? 'border-y-primary/60 bg-primary/5'
                                    : showTopSep
                                      ? 'border-t-border border-b-transparent'
                                      : 'border-y-transparent',
                            );
                            return (
                            <tr
                                key={tier.id}
                                onClick={() => onSelect(tier.id)}
                                className={cn(
                                    'cursor-pointer transition-colors',
                                    !selected && 'hover:bg-muted/50',
                                )}
                            >
                                <td className={cn(tdBase, 'border-l', selected ? 'border-l-primary/60' : 'border-l-transparent')}>
                                    <div className="flex items-center justify-center gap-1.5 font-medium">
                                        <HardDrive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        {tier.diskMB / 1024} GiB
                                    </div>
                                </td>
                                <td className={tdBase}>
                                    <div className="flex items-center justify-center gap-1.5 font-medium">
                                        <Archive className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        {tier.backups}
                                    </div>
                                </td>
                                <td className={tdBase}>
                                    <div className="flex items-center justify-center gap-1.5 font-medium">
                                        <Network className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        {tier.ports}
                                    </div>
                                </td>
                                <td className={cn(tdBase, 'text-right pr-3 whitespace-nowrap border-r', selected ? 'border-r-primary/60' : 'border-r-transparent')}>
                                    {tier.priceCents > 0 ? (
                                        <span className="font-semibold tabular-nums">
                                            +
                                            {(
                                                Math.round((tier.priceCents / 30) * days) / 100
                                            ).toFixed(2)}{' '}
                                            €
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            {t('free')}
                                        </span>
                                    )}
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Desktop: grid of cards */}
            <div
                className={cn(
                    'hidden sm:grid gap-2',
                    tiers.length === 1 ? 'grid-cols-1' : 'grid-cols-3',
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
                        <div className="flex flex-col p-3">
                            {tier.name && (
                                <div className="text-xs font-medium text-muted-foreground mb-3">
                                    {tier.name}
                                </div>
                            )}
                            <div className="flex flex-col gap-5 flex-1">
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
                                        +
                                        {(
                                            Math.round((tier.priceCents / 30) * days) / 100
                                        ).toFixed(2)}{' '}
                                        €
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
