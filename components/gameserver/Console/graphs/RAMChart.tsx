'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useTranslations } from 'next-intl';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

interface RAMChartProps {
    newData: {
        memory_bytes?: number;
        memory_limit_bytes?: number;
    };
    memoryLimit: number;
}

interface DataPoint {
    timestamp: number;
    ram: number;
}

const FIVE_MINUTES = 300;

const config = {
    ram: {
        label: 'RAM',
        theme: {
            light: 'hsl(273 100% 63.7%)',
            dark: 'hsl(273 100% 63.7%)',
        },
    },
} satisfies ChartConfig;

export default function RAMChart({ newData, memoryLimit }: RAMChartProps) {
    const [data, setData] = useState<DataPoint[]>([]);
    const lastUpdate = useRef<number>(0);
    const t = useTranslations();

    useEffect(() => {
        if (newData?.memory_bytes === undefined) return;

        const now = Date.now() / 1000;
        if (now - lastUpdate.current < 1) return;

        lastUpdate.current = now;

        setData((prev) => {
            const point: DataPoint = {
                timestamp: now,
                ram: newData.memory_bytes!,
            };

            const updated = [...prev, point];
            const cutoff = now - FIVE_MINUTES;
            return updated.filter((p) => p.timestamp > cutoff);
        });
    }, [newData]);

    const displayData = useMemo(() => {
        if (data.length === 0) return [];

        const now = new Date().getTime() / 1000;
        const fiveMinAgo = now - FIVE_MINUTES;

        const result: DataPoint[] = [];

        // Extend the first data point back instead of starting at 0
        if (data[0].timestamp > fiveMinAgo) {
            result.push({ timestamp: fiveMinAgo, ram: data[0].ram });
        }

        result.push(...data);

        if (data[data.length - 1].timestamp < now) {
            result.push({ timestamp: now, ram: data[data.length - 1].ram });
        }

        return result;
    }, [data]);

    // Calculate Y-axis ticks based on memory limit
    const yTicks = useMemo(() => {
        const maxY = memoryLimit;
        if (maxY <= 2) {
            return [0, 0.5, 1, 1.5, 2].filter((v) => v <= maxY);
        } else if (maxY <= 4) {
            return [0, 1, 2, 3, 4].filter((v) => v <= maxY);
        } else if (maxY <= 8) {
            return [0, 2, 4, 6, 8].filter((v) => v <= maxY);
        } else if (maxY <= 16) {
            return [0, 4, 8, 12, 16].filter((v) => v <= maxY);
        } else if (maxY <= 32) {
            return [0, 8, 16, 24, 32].filter((v) => v <= maxY);
        } else {
            const step = Math.ceil(maxY / 5);
            return [0, step, step * 2, step * 3, step * 4, step * 5].filter((v) => v <= maxY);
        }
    }, [memoryLimit]);

    const formatTime = (ts: number): string => {
        const now = Date.now() / 1000;
        const diff = Math.floor(now - ts);

        if (diff < 60) return `${diff}s`;
        return `${Math.floor(diff / 60)}m`;
    };

    const formatMemory = (gb: number): string => {
        if (gb >= 1) return `${gb.toFixed(1)} GiB`;
        return `${(gb * 1024).toFixed(0)} MiB`;
    };

    const currentRam =
        newData?.memory_bytes !== undefined ? formatMemory(newData.memory_bytes) : 'N/A';
    const limitLabel = t('gameserver.dashboard.charts.memoryGiB', { amount: memoryLimit });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                    {t('gameserver.dashboard.charts.current')}:{' '}
                    <span className="font-semibold text-foreground">{currentRam}</span>
                </div>
                <div className="text-muted-foreground">
                    {t('gameserver.dashboard.charts.limit')}:{' '}
                    <span className="font-semibold text-foreground">{limitLabel}</span>
                </div>
            </div>

            <ChartContainer config={config} className="h-37.5 w-full">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradRam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-ram)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="var(--color-ram)" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={true}
                        horizontal={true}
                        className="stroke-muted"
                    />

                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={formatTime}
                        tickLine={true}
                        axisLine={true}
                        tickMargin={8}
                        className="text-xs"
                    />

                    <YAxis
                        domain={[0, memoryLimit]}
                        ticks={yTicks}
                        tickLine={true}
                        axisLine={true}
                        tickMargin={8}
                        tickFormatter={(v) => `${v} GiB`}
                        width={50}
                        className="text-xs"
                    />

                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, p) =>
                                    p?.[0] ? formatTime(p[0].payload.timestamp) : ''
                                }
                                formatter={(v) => [formatMemory(Number(v)), 'RAM']}
                            />
                        }
                    />

                    <Area
                        dataKey="ram"
                        type="monotone"
                        fill="url(#gradRam)"
                        stroke="var(--color-ram)"
                        strokeWidth={2}
                        isAnimationActive={false}
                        dot={false}
                        fillOpacity={1}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
}
