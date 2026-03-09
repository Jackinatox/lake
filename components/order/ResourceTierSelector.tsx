'use client';

import { cn } from '@/lib/utils';
import { Archive, HardDrive, Network } from 'lucide-react';
import type { ResourceTierDisplay } from './PerformanceConfigurator';

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
    if (tiers.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            {tiers.map((tier) => (
                <button
                    key={tier.id}
                    type="button"
                    onClick={() => onSelect(tier.id)}
                    className={cn(
                        'flex items-center justify-between gap-4 rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 cursor-pointer',
                        selectedId === tier.id
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
                    )}
                >
                    {/* Price — left */}
                    <div className="shrink-0 w-16 text-center">
                        {tier.priceCents > 0 ? (
                            <span className="text-base font-bold text-primary">
                                {(tier.priceCents / 100).toFixed(2)} €
                            </span>
                        ) : (
                            <span className="text-base font-bold text-green-600 dark:text-green-400">
                                Free
                            </span>
                        )}
                        {tier.name && (
                            <div className="text-xs text-muted-foreground mt-0.5">{tier.name}</div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="w-px self-stretch bg-border" />

                    {/* Stats — right */}
                    <div className="flex flex-1 items-center justify-around gap-3 text-sm">
                        <Stat icon={HardDrive} value={`${tier.diskMB / 1024} GiB`} label="Disk" />
                        <Stat icon={Archive} value={String(tier.backups)} label="Backups" />
                        <Stat icon={Network} value={String(tier.ports)} label="Ports" />
                    </div>
                </button>
            ))}
        </div>
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
            <span className="font-semibold">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
}
