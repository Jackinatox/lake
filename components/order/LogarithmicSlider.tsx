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

    return (
        <div className="space-y-1">
            <div className="relative">
                {/* Tick marks */}
                <div className="absolute inset-0 pointer-events-none">
                    {ticks.map((tick) => (
                        <div
                            key={tick.value}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-3 bg-muted-foreground/40 rounded-full z-10"
                            style={{
                                left: `calc(10px + (100% - 20px) * ${tick.percent / 100})`,
                            }}
                        />
                    ))}
                </div>

                {/* Recommendation markers */}
                {markerPositions.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                        {markerPositions.map((m, i) => (
                            <div
                                key={i}
                                className="absolute top-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
                                style={{
                                    left: `calc(10px + (100% - 20px) * ${m.percent / 100})`,
                                    transform: 'translateX(-50%) translateY(-50%)',
                                }}
                                title={m.label}
                            >
                                <div className={`w-0.5 h-5 rounded-full ${m.color}`} />
                            </div>
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

            {/* Marker labels below slider */}
            {markerPositions.length > 0 && (
                <div className="relative h-3">
                    {markerPositions.map((m, i) => (
                        <div
                            key={i}
                            className="absolute -translate-x-1/2 text-[10px] leading-none whitespace-nowrap"
                            style={{
                                left: `calc(10px + (100% - 20px) * ${m.percent / 100})`,
                            }}
                        >
                            <span className={m.color.replace('bg-', 'text-')}>{m.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Labels under the slider */}
            <div className="flex justify-between text-xs text-muted-foreground">
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
