'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    RENEWAL_KEYS,
    RENEWAL_META,
    cpuPercentToThreads,
    formatGiB,
} from '@/lib/gameserver/adminServers';
import { GameServerStatus, GameServerType } from '@/app/client/generated/enums';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STATUS_META, TYPE_META } from './presentation';
import type { ServerSlice, ServerStats, ServerFilterState } from './types';
import { useServerParams } from './useServerParams';

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
 * game). Fixed order, never cycled. The slot itself is assigned in `page.tsx` from the full
 * list of locations/games, so a slice keeps its colour across filter changes and reloads.
 *
 * These are CSS variables (`app/globals.css`, light + `.dark`), applied inline rather than as
 * `bg-[#hex]` utilities: an arbitrary-value class only exists if Tailwind's scanner happens to
 * have picked it up, which in dev can lag behind an edit and leave the bar unpainted until a
 * rebuild. A variable always resolves, and it swaps with the theme without a second class.
 */
const SERIES_COLORS = [
    'var(--series-1)',
    'var(--series-2)',
    'var(--series-3)',
    'var(--series-4)',
    'var(--series-5)',
    'var(--series-6)',
    'var(--series-7)',
    'var(--series-8)',
];

const OTHER_COLOR = 'bg-muted-foreground/40';

/** Renewal buckets are a state, not an identity — urgency colours, darkest problem first. */
const RENEWAL_BAR: Record<string, string> = {
    overdue: 'bg-red-500',
    day: 'bg-amber-500',
    week: 'bg-sky-500',
    month: 'bg-emerald-500',
    later: 'bg-muted-foreground/40',
};

type Segment = ServerSlice & {
    /** Tailwind class for the dimensions whose colour carries meaning (status, plan, renewal). */
    bar?: string;
    /** Resolved colour for the categorical dimensions — applied inline, see `SERIES_COLORS`. */
    barColor?: string;
};

/** Whichever of the two a segment carries, as props for the painted element. */
function paint(segment: Segment) {
    return {
        className: segment.bar,
        style: segment.barColor ? { backgroundColor: segment.barColor } : undefined,
    };
}

/**
 * Paints a slice from its server-assigned slot (`colorIndex`), so a location keeps its colour
 * no matter which other slices the filter leaves standing. Entities past the eighth share the
 * neutral "other" grey rather than getting an invented ninth hue — they keep their own slice
 * and label, so the legend still tells them apart.
 */
function withCategoricalColors(slices: ServerSlice[]): Segment[] {
    return slices.map((slice) =>
        slice.colorIndex !== undefined && slice.colorIndex < SERIES_COLORS.length
            ? { ...slice, barColor: SERIES_COLORS[slice.colorIndex] }
            : { ...slice, bar: OTHER_COLOR },
    );
}

export default function ServerDistribution({
    stats,
    filters,
}: {
    stats: ServerStats;
    filters: ServerFilterState;
}) {
    const [dimension, setDimension] = useState<Dimension>('location');
    const [metric, setMetric] = useState<'count' | 'ram'>('count');
    const [hovered, setHovered] = useState<string | null>(null);
    const { only, pending } = useServerParams();

    const segments: Segment[] =
        dimension === 'location'
            ? withCategoricalColors(stats.byLocation)
            : dimension === 'game'
              ? withCategoricalColors(stats.byGame)
              : dimension === 'status'
                ? // Deleted is a status like any other: it reads 0 until the filter above lets
                  // deleted rows in, and clicking it filters to exactly those.
                  Object.values(GameServerStatus).map((status) => ({
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
    const weight = (slice: ServerSlice) =>
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
            `${share(segment).toFixed(0)}% of the selection`,
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
                            {unit}
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
                                    style={{
                                        flexGrow: weight(segment),
                                        flexBasis: 0,
                                        ...paint(segment).style,
                                    }}
                                    onMouseEnter={() => setHovered(segment.key)}
                                    onMouseLeave={() => setHovered(null)}
                                    onFocus={() => setHovered(segment.key)}
                                    onBlur={() => setHovered(null)}
                                    disabled={Object.keys(segment.filter).length === 0}
                                    onClick={() => only(isActive(segment) ? {} : segment.filter)}
                                    aria-label={`${segment.label}: ${describe(segment)}`}
                                    className={cn(
                                        'h-full min-w-[3px] transition-opacity',
                                        paint(segment).className,
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
                                    style={paint(segment).style}
                                    className={cn(
                                        'h-2 w-2 shrink-0 rounded-full',
                                        paint(segment).className,
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
