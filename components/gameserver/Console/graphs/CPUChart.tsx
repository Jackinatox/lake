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

interface CPUChartProps {
    newData: {
        cpu_absolute?: number; // Percentage of the limit (0-100%)
    };
    cpuLimit: number; // Number of cores (e.g., 8 for 800%)
}

interface DataPoint {
    timestamp: number;
    cpu: number;
}

const FIVE_MINUTES = 300;

const config = {
    cpu: {
        label: 'CPU',
        theme: {
            light: 'hsl(221 83% 53%)',
            dark: 'hsl(217 91% 60%)',
        },
    },
} satisfies ChartConfig;

export default function CPUChart({ newData, cpuLimit }: CPUChartProps) {
    const [data, setData] = useState<DataPoint[]>([]);
    const lastUpdate = useRef<number>(0);
    const t = useTranslations();

    useEffect(() => {
        if (newData?.cpu_absolute === undefined) return;

        const now = Date.now() / 1000;
        if (now - lastUpdate.current < 1) return;

        lastUpdate.current = now;

        setData((prev) => {
            const point: DataPoint = {
                timestamp: now,
                cpu: Math.round(newData.cpu_absolute! * 10) / 10,
            };

            const updated = [...prev, point];
            const cutoff = now - FIVE_MINUTES;
            return updated.filter((p) => p.timestamp > cutoff);
        });
    }, [newData]);

    const displayData = useMemo(() => {
        if (data.length === 0) return [];

        const now = Date.now() / 1000;
        const fiveMinAgo = now - FIVE_MINUTES;

        const result: DataPoint[] = [];

        // Extend the first data point back instead of starting at 0
        if (data[0].timestamp > fiveMinAgo) {
            result.push({ timestamp: fiveMinAgo, cpu: data[0].cpu });
        }

        result.push(...data);

        if (data[data.length - 1].timestamp < now) {
            result.push({ timestamp: now, cpu: data[data.length - 1].cpu });
        }

        return result;
    }, [data]);

    // Calculate dynamic Y-axis domain based on data
    const { yDomain, yTicks } = useMemo(() => {
        if (data.length === 0) {
            return { yDomain: [0, 100] as [number, number], yTicks: [0, 20, 40, 60, 80, 100] };
        }

        const maxValue = Math.max(...data.map((d) => d.cpu));

        if (maxValue >= 50) {
            return { yDomain: [0, 100] as [number, number], yTicks: [0, 20, 40, 60, 80, 100] };
        }

        let maxY: number;
        let ticks: number[];

        if (maxValue >= 20) {
            maxY = 50;
            ticks = [0, 10, 20, 30, 40, 50];
        } else if (maxValue >= 10) {
            maxY = 25;
            ticks = [0, 5, 10, 15, 20, 25];
        } else if (maxValue >= 5) {
            maxY = 10;
            ticks = [0, 2, 4, 6, 8, 10];
        } else if (maxValue >= 2) {
            maxY = 5;
            ticks = [0, 1, 2, 3, 4, 5];
        } else if (maxValue >= 1) {
            maxY = 2;
            ticks = [0, 0.5, 1, 1.5, 2];
        } else {
            maxY = 1;
            ticks = [0, 0.2, 0.4, 0.6, 0.8, 1];
        }

        return { yDomain: [0, maxY] as [number, number], yTicks: ticks };
    }, [data]);

    const formatTime = (ts: number): string => {
        const now = Date.now() / 1000;
        const diff = Math.floor(now - ts);

        if (diff < 60) return `${diff}s`;
        return `${Math.floor(diff / 60)}m`;
    };

    const currentCpu =
        newData?.cpu_absolute !== undefined ? `${newData.cpu_absolute.toFixed(1)}%` : 'N/A';
    const limitLabel = t('gameserver.dashboard.charts.cpuCores', { cores: cpuLimit });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                    {t('gameserver.dashboard.charts.current')}:{' '}
                    <span className="font-semibold text-foreground">{currentCpu}</span>
                </div>
                <div className="text-muted-foreground">
                    {t('gameserver.dashboard.charts.limit')}:{' '}
                    <span className="font-semibold text-foreground">{limitLabel}</span>
                </div>
            </div>

            <ChartContainer config={config} className="h-37.5 w-full">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-cpu)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="var(--color-cpu)" stopOpacity={0.05} />
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
                        domain={yDomain}
                        ticks={yTicks}
                        tickLine={true}
                        axisLine={true}
                        tickMargin={8}
                        tickFormatter={(v) => `${v}%`}
                        width={45}
                        className="text-xs"
                    />

                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, p) =>
                                    p?.[0] ? formatTime(p[0].payload.timestamp) : ''
                                }
                                formatter={(v) => [`${Number(v).toFixed(1)}%`, 'CPU']}
                            />
                        }
                    />

                    <Area
                        dataKey="cpu"
                        type="monotone"
                        fill="url(#gradCpu)"
                        stroke="var(--color-cpu)"
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
