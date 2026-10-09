'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    RENEWAL_KEYS,
    RENEWAL_META,
    cpuPercentToThreads,
    formatGiB,
} from '@/lib/gameserver/adminFleet';
import { GameServerStatus, GameServerType } from '@/app/client/generated/enums';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STATUS_META, TYPE_META } from './presentation';
import type { FleetSlice, FleetStats, ServerFilterState } from './types';
import { useFleetParams } from './useFleetParams';

type Dimension = 'location' | 'game' | 'status' | 'type' | 'renewal';

const DIMENSIONS: { key: Dimension; label: string }[] = [
    { key: 'location', label: 'Location' },
    { key: 'game', label: 'Game' },
    { key: 'status', label: 'Status' },
    { key: 'type', label: 'Plan' },
    { key: 'renewal', label: 'Renewals' },
];

/** Location and game carry resources, so they can be weighted by RAM instead of by headcount. */
const RESOURCE_DIMENSIONS: Dimension[] = ['location', 'game'];

/**
 * Categorical palette for the dimensions that have no meaning-colour of their own (location,
 * game). Fixed order, never cycled: slots are handed out by a stable sort of the entity ids, so
 * filtering or a change in ranking never repaints a slice. Beyond eight entities the rest folds
 * into "Other" rather than inventing a ninth hue.
 *
 * Both columns are validated for colour-vision deficiency against their own surface (worst
 * adjacent ΔE 9.1 light / 8.4 dark, OKLab ×100). Every slice is also named in the legend, which
 * is what keeps the three light steps that sit under 3:1 contrast legible.
 */
const SERIES_COLORS = [
    'bg-[#2a78d6] dark:bg-[#3987e5]',
    'bg-[#eb6834] dark:bg-[#d95926]',
    'bg-[#1baf7a] dark:bg-[#199e70]',
    'bg-[#eda100] dark:bg-[#c98500]',
    'bg-[#e87ba4] dark:bg-[#d55181]',
    'bg-[#008300] dark:bg-[#008300]',
    'bg-[#4a3aa7] dark:bg-[#9085e9]',
    'bg-[#e34948] dark:bg-[#e66767]',
];

const OTHER_COLOR = 'bg-muted-foreground/40';
const MAX_SERIES = SERIES_COLORS.length;

/** Renewal buckets are a state, not an identity — urgency colours, darkest problem first. */
const RENEWAL_BAR: Record<string, string> = {
    overdue: 'bg-red-500',
    day: 'bg-amber-500',
    week: 'bg-sky-500',
    month: 'bg-emerald-500',
    later: 'bg-muted-foreground/40',
};

type Segment = FleetSlice & { bar: string };

/**
 * Hands out palette slots by entity id (ascending), not by the slice's rank in the current
 * view, and folds everything past the eighth entity into one "Other" slice.
 */
function withCategoricalColors(slices: FleetSlice[]): Segment[] {
    const order = [...slices].sort((a, b) => Number(a.key) - Number(b.key));
    const slot = new Map(order.map((slice, index) => [slice.key, index]));

    if (slices.length <= MAX_SERIES) {
        return slices.map((slice) => ({
            ...slice,
            bar: SERIES_COLORS[slot.get(slice.key) ?? 0],
        }));
    }

    const ranked = [...slices].sort((a, b) => b.count - a.count);
    const kept = ranked.slice(0, MAX_SERIES - 1);
    const rest = ranked.slice(MAX_SERIES - 1);

    return [
        ...kept.map((slice) => ({ ...slice, bar: SERIES_COLORS[slot.get(slice.key) ?? 0] })),
        {
            key: '__other__',
            label: `Other (${rest.length})`,
            count: rest.reduce((sum, slice) => sum + slice.count, 0),
            ramMB: rest.reduce((sum, slice) => sum + slice.ramMB, 0),
            cpuPercent: rest.reduce((sum, slice) => sum + slice.cpuPercent, 0),
            filter: {},
            bar: OTHER_COLOR,
        },
    ];
}

export default function FleetDistribution({
    stats,
    filters,
    scopeNote,
}: {
    stats: FleetStats;
    filters: ServerFilterState;
    /** What the bar is a distribution *of* — "excl. deleted", or "current filter". */
    scopeNote: string;
}) {
    const [dimension, setDimension] = useState<Dimension>('location');
    const [metric, setMetric] = useState<'count' | 'ram'>('count');
    const [hovered, setHovered] = useState<string | null>(null);
    const { only, pending } = useFleetParams();

    const segments: Segment[] =
        dimension === 'location'
            ? withCategoricalColors(stats.byLocation)
            : dimension === 'game'
              ? withCategoricalColors(stats.byGame)
              : dimension === 'status'
                ? Object.values(GameServerStatus)
                      .filter((status) => status !== 'DELETED')
                      .map((status) => ({
                          key: status,
                          label: STATUS_META[status].label,
                          count: stats.byStatus[status] ?? 0,
                          ramMB: 0,
                          cpuPercent: 0,
                          filter: { status },
                          bar: STATUS_META[status].bar,
                      }))
                : dimension === 'type'
                  ? Object.values(GameServerType).map((type) => ({
                        key: type,
                        label: TYPE_META[type].label,
                        count: stats.byType[type] ?? 0,
                        ramMB: 0,
                        cpuPercent: 0,
                        filter: { type },
                        bar: TYPE_META[type].bar,
                    }))
                  : RENEWAL_KEYS.map((key) => ({
                        key,
                        label: RENEWAL_META[key].label,
                        count: stats.renewals[key] ?? 0,
                        ramMB: 0,
                        cpuPercent: 0,
                        filter: { renewal: key },
                        bar: RENEWAL_BAR[key],
                    }));

    const showResources = RESOURCE_DIMENSIONS.includes(dimension);
    const weight = (slice: FleetSlice) =>
        showResources && metric === 'ram' ? slice.ramMB : slice.count;

    const total = segments.reduce((sum, segment) => sum + weight(segment), 0);
    // Zero-width segments would still eat a 2px gap, so only non-empty ones reach the bar —
    // they stay in the legend, where a "0" is worth reading.
    const drawn = segments.filter((segment) => weight(segment) > 0);

    const isActive = (segment: Segment) =>
        Object.keys(segment.filter).length > 0 &&
        Object.entries(segment.filter).every(
            ([key, value]) => filters[key as keyof ServerFilterState] === value,
        );

    const share = (segment: Segment) => (total > 0 ? (weight(segment) / total) * 100 : 0);

    const describe = (segment: Segment) =>
        [
            `${segment.count} server${segment.count === 1 ? '' : 's'}`,
            showResources && `${formatGiB(segment.ramMB)} GiB RAM`,
            showResources && `${cpuPercentToThreads(segment.cpuPercent).toFixed(1)} threads`,
            `${share(segment).toFixed(0)}% of the fleet`,
        ]
            .filter(Boolean)
            .join(' · ');

    const unit = showResources && metric === 'ram' ? `${formatGiB(total)} GiB` : `${total} servers`;

    return (
        <TooltipProvider>
            <div
                className={cn(
                    'space-y-2 rounded-md border px-2 py-1.5 transition-opacity',
                    pending && 'opacity-60',
                )}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Distribution
                    </span>
                    <div className="flex items-center gap-0.5">
                        {DIMENSIONS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setDimension(item.key)}
                                className={cn(
                                    'rounded px-1.5 py-0.5 text-[11px] transition-colors hover:bg-muted',
                                    dimension === item.key && 'bg-muted font-medium',
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        {showResources && (
                            <div className="flex items-center gap-0.5 rounded border p-0.5">
                                {(['count', 'ram'] as const).map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setMetric(item)}
                                        className={cn(
                                            'rounded px-1.5 text-[11px] transition-colors hover:bg-muted',
                                            metric === item && 'bg-muted font-medium',
                                        )}
                                    >
                                        {item === 'count' ? 'by servers' : 'by RAM'}
                                    </button>
                                ))}
                            </div>
                        )}
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                            {unit} · {scopeNote}
                        </span>
                    </div>
                </div>

                {/* One stacked bar. Segments are separated by a 2px surface gap, never a border. */}
                <div
                    className={cn(
                        'flex h-3 gap-[2px] overflow-hidden rounded-full',
                        // The 2px gaps are meant to show the surface, so the track only paints
                        // when there is nothing stacked on top of it.
                        drawn.length === 0 && 'bg-muted/60',
                    )}
                >
                    {drawn.map((segment) => (
                        <Tooltip key={segment.key}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    style={{ flexGrow: weight(segment), flexBasis: 0 }}
                                    onMouseEnter={() => setHovered(segment.key)}
                                    onMouseLeave={() => setHovered(null)}
                                    onFocus={() => setHovered(segment.key)}
                                    onBlur={() => setHovered(null)}
                                    disabled={Object.keys(segment.filter).length === 0}
                                    onClick={() => only(isActive(segment) ? {} : segment.filter)}
                                    aria-label={`${segment.label}: ${describe(segment)}`}
                                    className={cn(
                                        'h-full min-w-[3px] transition-opacity',
                                        segment.bar,
                                        hovered && hovered !== segment.key && 'opacity-30',
                                        // inset: a normal ring would be clipped by the bar
                                        isActive(segment) && 'ring-2 ring-inset ring-foreground/60',
                                    )}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <span className="font-medium">{segment.label}</span>
                                <span className="block text-muted-foreground">
                                    {describe(segment)}
                                </span>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    {drawn.length === 0 && (
                        <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                            nothing to show
                        </span>
                    )}
                </div>

                {/* Legend — also the direct labels, and the clickable filter for each slice */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {segments.map((segment) => {
                        const active = isActive(segment);
                        const empty = weight(segment) === 0;

                        return (
                            <button
                                key={segment.key}
                                type="button"
                                disabled={Object.keys(segment.filter).length === 0}
                                onMouseEnter={() => setHovered(segment.key)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => only(active ? {} : segment.filter)}
                                title={
                                    active
                                        ? 'Click to clear the filter'
                                        : `Show only ${segment.label}`
                                }
                                className={cn(
                                    'flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] transition-colors',
                                    empty ? 'text-muted-foreground/60' : 'hover:bg-muted',
                                    active && 'bg-muted font-medium',
                                    hovered === segment.key && !active && 'bg-muted/60',
                                )}
                            >
                                <span
                                    className={cn(
                                        'h-2 w-2 shrink-0 rounded-full',
                                        segment.bar,
                                        empty && 'opacity-40',
                                    )}
                                />
                                <span className="truncate">{segment.label}</span>
                                <span className="font-mono tabular-nums text-muted-foreground">
                                    {showResources && metric === 'ram'
                                        ? `${formatGiB(segment.ramMB)}G`
                                        : segment.count}
                                </span>
                                <span className="font-mono tabular-nums text-muted-foreground/70">
                                    {share(segment).toFixed(0)}%
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}
