'use client';

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface RAMData {
    time: number;
    value: number;
}

interface RAMChartProps {
    newData: {
        memory_bytes?: number; // Already in GB from the parent component
        memory_limit_bytes?: number; // Already in GB from the parent component
    };
    memoryLimit: number; // Memory limit in GiB
}

const chartConfig = {
    value: {
        label: 'RAM Usage',
        color: 'hsl(var(--chart-1))',
    },
} satisfies ChartConfig;

const HISTORY_DURATION = 300; // 5 minutes in seconds

function RAMChart({ newData, memoryLimit }: RAMChartProps) {
    const [chartData, setChartData] = useState<RAMData[]>([]);
    const lastUpdateTime = useRef<number>(0);
    const t = useTranslations();

    // Format GB values for display
    const formatGB = (gb: number): string => {
        return gb >= 1 ? `${gb.toFixed(2)} GiB` : `${(gb * 1024).toFixed(0)} MiB`;
    };

    // Calculate the max Y value based on memory limit
    const maxMemoryGB = useMemo(() => {
        return Math.ceil(memoryLimit);
    }, [memoryLimit]);

    useEffect(() => {
        if (newData?.memory_bytes === undefined) return;

        const now = Math.floor(Date.now() / 1000);

        // Throttle updates to once per second
        if (now - lastUpdateTime.current < 1) return;
        lastUpdateTime.current = now;

        const newPoint: RAMData = {
            time: now,
            value: newData.memory_bytes, // Already in GB
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

    const currentUsage =
        newData?.memory_bytes !== undefined ? formatGB(newData.memory_bytes) : 'N/A';
    const memoryLimitLabel = t('gameserver.dashboard.charts.memoryGiB', { amount: memoryLimit });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                    {t('gameserver.dashboard.charts.current')}:{' '}
                    <span className="font-semibold text-foreground">{currentUsage}</span>
                </div>
                <div className="text-muted-foreground">
                    {t('gameserver.dashboard.charts.limit')}:{' '}
                    <span className="font-semibold text-foreground">{memoryLimitLabel}</span>
                </div>
            </div>

            <ChartContainer config={chartConfig} className="h-[150px] w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
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
                        domain={[0, maxMemoryGB]}
                        tickCount={5}
                        tickFormatter={(value) => `${value} GiB`}
                        width={50}
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
                                formatter={(value) => `${Number(value).toFixed(2)} GiB`}
                            />
                        }
                    />

                    <Area
                        dataKey="value"
                        type="monotone"
                        fill="url(#ramGradient)"
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

export default RAMChart;
