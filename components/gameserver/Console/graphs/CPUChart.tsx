'use client';

import { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useTranslations } from 'next-intl';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

interface CPUData {
    time: number;
    value: number;
}

interface CPUChartProps {
    newData: {
        cpu_absolute?: number;
    };
    cpuLimit: number; // Total CPU cores available (e.g., 8 for 800% limit)
}

const chartConfig = {
    value: {
        label: 'CPU',
        color: 'hsl(var(--chart-1))',
    },
} satisfies ChartConfig;

const HISTORY_DURATION = 300; // 5 minutes in seconds

function CPUChart({ newData, cpuLimit }: CPUChartProps) {
    const [chartData, setChartData] = useState<CPUData[]>([]);
    const lastUpdateTime = useRef<number>(0);
    const t = useTranslations();

    useEffect(() => {
        if (newData?.cpu_absolute === undefined) return;

        const now = Math.floor(Date.now() / 1000);

        // Throttle updates to once per second
        if (now - lastUpdateTime.current < 1) return;
        lastUpdateTime.current = now;

        const newPoint: CPUData = {
            time: now,
            value: newData.cpu_absolute,
        };

        setChartData((prevData) => {
            const updated = [...prevData, newPoint];
            // Keep only last 5 minutes of data
            return updated.filter((d) => now - d.time <= HISTORY_DURATION);
        });
    }, [newData]);

    const formatTimeAgo = (timestamp: number): string => {
        const now = Math.floor(Date.now() / 1000);
        const secondsAgo = now - timestamp;

        if (secondsAgo < 60) return `${secondsAgo}s`;
        return `${Math.floor(secondsAgo / 60)}m`;
    };

    const currentUsage = newData?.cpu_absolute !== undefined ? `${newData.cpu_absolute}%` : 'N/A';
    const coresLabel = t('gameserver.dashboard.charts.cpuCores', { cores: cpuLimit });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                    {t('gameserver.dashboard.charts.current')}:{' '}
                    <span className="font-semibold text-foreground">{currentUsage}</span>
                </div>
                <div className="text-muted-foreground">
                    {t('gameserver.dashboard.charts.limit')}:{' '}
                    <span className="font-semibold text-foreground">{coresLabel}</span>
                </div>
            </div>

            <ChartContainer config={chartConfig} className="h-[150px] w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor={chartConfig.value.color}
                                stopOpacity={0.8}
                            />
                            <stop
                                offset="95%"
                                stopColor={chartConfig.value.color}
                                stopOpacity={0.1}
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        className="stroke-muted"
                    />

                    <XAxis
                        dataKey="time"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={60}
                        tickFormatter={formatTimeAgo}
                        className="text-xs"
                    />

                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        domain={[0, 100]}
                        tickCount={5}
                        tickFormatter={(value) => `${value}%`}
                        width={45}
                        className="text-xs"
                    />

                    <ChartTooltip
                        content={
                            <ChartTooltipContent
                                indicator="dot"
                                labelFormatter={(_, payload) => {
                                    if (payload?.[0]) {
                                        return formatTimeAgo(payload[0].payload.time);
                                    }
                                    return '';
                                }}
                                formatter={(value) => `${Number(value).toFixed(1)}%`}
                            />
                        }
                    />

                    <Area
                        dataKey="value"
                        type="monotone"
                        fill="url(#cpuGradient)"
                        stroke={chartConfig.value.color}
                        strokeWidth={2}
                        isAnimationActive={false}
                        dot={false}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
}

export default CPUChart;
