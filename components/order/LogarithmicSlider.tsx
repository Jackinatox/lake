'use client';

import { Slider } from '@/components/ui/slider';
import { useCallback, useMemo } from 'react';

export interface SliderMarker {
    /** The value to place the marker at (in the same unit as stops) */
    value: number;
    /** Color class for the marker line */
    color: string;
    /** Short label shown as tooltip */
    label: string;
}

interface LogarithmicSliderProps {
    /** The discrete stop values (e.g. [1,2,3,4,6,8,10,16]) */
    stops: number[];
    /** Currently selected value (must be one of stops) */
    value: number;
    /** Called with the new value when the user drags */
    onChange: (value: number) => void;
    /** Unit label shown next to tick labels */
    unit?: string;
    /** Whether tick spacing should represent actual value gaps (logarithmic feel) */
    logarithmic?: boolean;
    /** Optional markers (e.g. min/recommended hardware) rendered as colored lines */
    markers?: SliderMarker[];
}

/**
 * A slider with discrete stops where the visual spacing reflects the actual
 * value gaps – smaller values are closer together, larger jumps get more space.
 *
 * Works by mapping each stop to a cumulative "position" based on the gap
 * between consecutive values, then using a hidden 0..totalRange slider
 * and snapping to the nearest stop.
 */
export default function LogarithmicSlider({
    stops,
    value,
    onChange,
    unit,
    logarithmic = false,
    markers,
}: LogarithmicSliderProps) {
    // Build position map: each stop gets a cumulative position proportional to gaps
    const { positions, totalRange } = useMemo(() => {
        if (stops.length <= 1) return { positions: [0], totalRange: 0 };

        if (!logarithmic) {
            // Linear: evenly spaced
            const pos = stops.map((_, i) => i);
            return { positions: pos, totalRange: stops.length - 1 };
        }

        // Logarithmic: position proportional to actual value gaps
        const pos: number[] = [0];
        let cumulative = 0;
        for (let i = 1; i < stops.length; i++) {
            cumulative += stops[i] - stops[i - 1];
            pos.push(cumulative);
        }
        return { positions: pos, totalRange: cumulative };
    }, [stops, logarithmic]);

    // Map value → slider position
    const sliderValue = useMemo(() => {
        const idx = stops.indexOf(value);
        if (idx === -1) return 0;
        return positions[idx];
    }, [stops, value, positions]);

    // Map slider position → snap to nearest stop
    const handleChange = useCallback(
        (vals: number[]) => {
            const raw = vals[0];
            // Find nearest stop position
            let bestIdx = 0;
            let bestDist = Math.abs(positions[0] - raw);
            for (let i = 1; i < positions.length; i++) {
                const dist = Math.abs(positions[i] - raw);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = i;
                }
            }
            if (stops[bestIdx] !== value) {
                onChange(stops[bestIdx]);
            }
        },
        [positions, stops, value, onChange],
    );

    // Tick percentage positions for rendering
    const ticks = useMemo(() => {
        if (totalRange === 0) return [];
        return stops.map((stop, i) => ({
            value: stop,
            percent: (positions[i] / totalRange) * 100,
        }));
    }, [stops, positions, totalRange]);

    // Compute marker positions by interpolating between stops
    const markerPositions = useMemo(() => {
        if (!markers || markers.length === 0 || totalRange === 0 || stops.length < 2) return [];
        return markers
            .map((m) => {
                // Find which two stops this value falls between
                if (m.value <= stops[0]) return { ...m, percent: 0 };
                if (m.value >= stops[stops.length - 1]) return { ...m, percent: 100 };

                for (let i = 0; i < stops.length - 1; i++) {
                    if (m.value >= stops[i] && m.value <= stops[i + 1]) {
                        const frac =
                            stops[i + 1] === stops[i]
                                ? 0
                                : (m.value - stops[i]) / (stops[i + 1] - stops[i]);
                        const pos = positions[i] + frac * (positions[i + 1] - positions[i]);
                        return { ...m, percent: (pos / totalRange) * 100 };
                    }
                }
                return null;
            })
            .filter(Boolean) as (SliderMarker & { percent: number })[];
    }, [markers, stops, positions, totalRange]);

    if (stops.length === 0) return null;

    // Current value percent (for deciding whether a range segment is "ahead" of thumb)
    const currentPercent = totalRange === 0 ? 0 : (sliderValue / totalRange) * 100;

    return (
        <div className="space-y-0">
            <div className="relative">
                {/* Range bands: red before min, amber→green from min to rec */}
                {markerPositions.length >= 2 && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                        {currentPercent < markerPositions[0].percent && (
                            <div
                                className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full"
                                style={{
                                    left: `calc(10px + (100% - 20px) * ${currentPercent / 100})`,
                                    width: `calc((100% - 20px) * ${(markerPositions[0].percent - currentPercent) / 100})`,
                                    backgroundColor: 'rgba(239, 68, 68, 0.35)',
                                }}
                            />
                        )}
                        {markerPositions.slice(0, -1).map((from, i) => {
                            const to = markerPositions[i + 1];
                            const visibleFrom = Math.max(from.percent, currentPercent);
                            if (visibleFrom >= to.percent) return null;
                            return (
                                <div
                                    key={i}
                                    className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full"
                                    style={{
                                        left: `calc(10px + (100% - 20px) * ${visibleFrom / 100})`,
                                        width: `calc((100% - 20px) * ${(to.percent - visibleFrom) / 100})`,
                                        backgroundImage: `linear-gradient(to right, rgba(234, 179, 8, 0.4), rgba(34, 197, 94, 0.4))`,
                                    }}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Recommendation marker lines */}
                {markerPositions.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none z-20">
                        {markerPositions.map((m, i) => (
                            <div
                                key={i}
                                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-5 rounded-full ${m.color}`}
                                style={{ left: `calc(10px + (100% - 20px) * ${m.percent / 100})` }}
                                title={m.label}
                            />
                        ))}
                    </div>
                )}

                <Slider
                    value={[sliderValue]}
                    min={0}
                    max={totalRange}
                    step={1}
                    onValueChange={handleChange}
                    className="w-full"
                />
            </div>

            {/* Tick ruler row */}
            <div className="relative h-3 pointer-events-none">
                {ticks.map((tick, i) => {
                    const isEdge = i === 0 || i === ticks.length - 1;
                    return (
                        <div
                            key={tick.value}
                            className={`absolute top-0 -translate-x-1/2 ${isEdge ? 'h-2.5 bg-muted-foreground/50' : 'h-1.5 bg-muted-foreground/30'} w-px`}
                            style={{ left: `calc(10px + (100% - 20px) * ${tick.percent / 100})` }}
                        />
                    );
                })}
                {/* Marker labels pinned to the same row */}
                {markerPositions.map((m, i) => (
                    <div
                        key={`label-${i}`}
                        className="absolute top-0 -translate-x-1/2 text-[9px] leading-none mt-[11px] whitespace-nowrap"
                        style={{ left: `calc(10px + (100% - 20px) * ${m.percent / 100})` }}
                    >
                        <span className={m.color.replace('bg-', 'text-')}>{m.label}</span>
                    </div>
                ))}
            </div>

            {/* Min / max value labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>
                    {stops[0]}
                    {unit ? ` ${unit}` : ''}
                </span>
                <span>
                    {stops[stops.length - 1]}
                    {unit ? ` ${unit}` : ''}
                </span>
            </div>
        </div>
    );
}
