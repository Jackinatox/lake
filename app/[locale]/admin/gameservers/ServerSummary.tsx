'use client';

import { cn } from '@/lib/utils';
import {
    ATTENTION_KEYS,
    ATTENTION_META,
    AttentionKey,
    cpuPercentToThreads,
    formatCents,
} from '@/lib/gameserver/adminServers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STATUS_META } from './presentation';
import type { ServerStats } from './types';
import { useServerParams } from './useServerParams';

type ServerSummaryProps = {
    stats: ServerStats;
    activeAttention?: AttentionKey;
    /** How many filters are active — the tiles describe that selection, not every server. */
    filterCount: number;
};

function Tile({
    label,
    value,
    unit,
    hint,
    tone,
}: {
    label: string;
    value: string;
    unit?: string;
    hint?: string;
    tone?: string;
}) {
    return (
        <div className="rounded-md border px-2.5 py-1.5">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className={cn('font-semibold tabular-nums leading-tight', tone)}>
                <span className="text-lg">{value}</span>
                {unit && <span className="ml-1 text-[11px] font-normal">{unit}</span>}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{hint ?? ' '}</div>
        </div>
    );
}

export default function ServerSummary({ stats, activeAttention, filterCount }: ServerSummaryProps) {
    const { toggleParam, pending } = useServerParams();

    const threads = cpuPercentToThreads(stats.cpuPercent);
    const ramGiB = stats.ramMB / 1024;
    const diskGiB = stats.diskMB / 1024;
    // TiB only once there is a TiB to show — "0.0 TiB" reads like a bug on a handful of servers
    const disk =
        diskGiB >= 1024 ? `${(diskGiB / 1024).toFixed(1)} TiB` : `${diskGiB.toFixed(0)} GiB`;
    const free = stats.byType.FREE ?? 0;
    const paid = stats.total - free;
    const suspended = stats.attention.suspended;

    return (
        <div className={cn('space-y-2 transition-opacity', pending && 'opacity-60')}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <Tile
                    label={filterCount > 0 ? 'Selection' : 'Servers'}
                    value={String(stats.total)}
                    unit="servers"
                    hint={`${stats.byStatus.ACTIVE} active · ${stats.byStatus.CREATED} installing`}
                />
                <Tile
                    label="Expired"
                    value={String(stats.byStatus.EXPIRED)}
                    hint={`${stats.byStatus.CREATION_FAILED} creation failed`}
                    tone={stats.byStatus.EXPIRED > 0 ? STATUS_META.EXPIRED.text : undefined}
                />
                <Tile
                    label="Suspended"
                    value={String(suspended)}
                    hint={suspended > 0 ? 'incl. grace window' : 'nothing quarantined'}
                    tone={suspended > 0 ? 'text-red-600 dark:text-red-400' : undefined}
                />
                <Tile
                    label="vCPU sold"
                    value={threads.toFixed(2)}
                    unit="threads"
                    hint={
                        stats.total > 0
                            ? `Ø ${(threads / stats.total).toFixed(2)} per server`
                            : undefined
                    }
                />
                <Tile label="RAM sold" value={ramGiB.toFixed(2)} unit="GiB" hint={`${disk} disk`} />
                <Tile
                    label="Renewal value"
                    value={formatCents(stats.renewalValueCents)}
                    hint={`${paid} paid · ${free} free`}
                />
            </div>

            {/* Needs attention — each chip is the exact filter that lists those servers */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Attention
                </span>
                <TooltipProvider>
                    {ATTENTION_KEYS.map((key) => {
                        const count = stats.attention[key];
                        const active = activeAttention === key;
                        const empty = count === 0;

                        return (
                            <Tooltip key={key}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        disabled={empty && !active}
                                        onClick={() => toggleParam('attention', key)}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                                            empty && !active
                                                ? 'cursor-default border-dashed text-muted-foreground/60'
                                                : 'hover:bg-muted',
                                            active && 'border-foreground/40 bg-muted font-medium',
                                            !empty &&
                                                !active &&
                                                'text-red-600 dark:text-red-400 border-red-500/40',
                                        )}
                                    >
                                        {ATTENTION_META[key].label}
                                        <span className="font-mono tabular-nums">{count}</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    {ATTENTION_META[key].hint}
                                    {!empty && (
                                        <span className="mt-1 block text-muted-foreground">
                                            {active
                                                ? 'Click to clear the filter'
                                                : 'Click to list them'}
                                        </span>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>
        </div>
    );
}
