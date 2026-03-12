'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
        <RadioGroup
            value={selectedId?.toString() ?? ''}
            onValueChange={(v) => onSelect(Number(v))}
            className="gap-2"
        >
            {tiers.map((tier) => (
                <Label
                    key={tier.id}
                    htmlFor={`tier-${tier.id}`}
                    className={cn(
                        'flex items-center gap-4 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                        selectedId === tier.id
                            ? 'border-primary bg-primary/5'
                            : 'border-input hover:bg-accent/50',
                    )}
                >
                    <RadioGroupItem id={`tier-${tier.id}`} value={tier.id.toString()} />

                    {/* Price */}
                    <div className="shrink-0 w-16 text-center">
                        {tier.priceCents > 0 ? (
                            <span className="text-sm font-semibold">
                                {(tier.priceCents / 100).toFixed(2)} €
                            </span>
                        ) : (
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {t('free')}
                            </span>
                        )}
                        {tier.name && (
                            <div className="text-xs text-muted-foreground mt-0.5">{tier.name}</div>
                        )}
                    </div>

                    <div className="w-px self-stretch bg-border" />

                    {/* Stats */}
                    <div className="flex flex-1 items-center justify-around gap-3 text-sm">
                        <Stat icon={HardDrive} value={`${tier.diskMB / 1024} GiB`} label={t('disk')} />
                        <Stat icon={Archive} value={String(tier.backups)} label={t('backups')} />
                        <Stat icon={Network} value={String(tier.ports)} label={t('ports')} />
                    </div>
                </Label>
            ))}
        </RadioGroup>
    );
}

function Stat({
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
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
}
