'use client';

import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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

const chartConfig = {
    value: {
        label: 'CPU',
        color: 'hsl(var(--chart-1))',
    },
} satisfies ChartConfig;

interface CPUChartProps {
    newData: any;
}

function CPUChart({ newData }: CPUChartProps) {
    const [chartData, setChartData] = useState<CPUData[]>([]);

    const addNewData = (newData: CPUData) => {
        setChartData(
            (prevData) => [...prevData, newData].filter((d) => newData.time - d.time <= 300), // Keep last 5 min
        );
    };

    useEffect(() => {
        addNewData({ time: Math.floor(Date.now() / 1000), value: newData?.cpu_absolute });
    }, [newData]);

    return (
        <div>
            <ChartContainer config={chartConfig}>
                <AreaChart data={chartData} margin={{ left: 0, right: 0 }}>
                    <CartesianGrid vertical={false} />

                    <XAxis
                        dataKey="time"
                        tickLine={true}
                        axisLine={true}
                        tickMargin={8}
                        domain={['auto', 'auto']} // Dynamically adjust X-axis
                        interval={29} // Label every 30s
                        tickFormatter={(time) => {
                            const now = Math.floor(Date.now() / 1000);
                            const secondsAgo = now - time;
                            return secondsAgo < 60
                                ? `${secondsAgo}s`
                                : `${Math.floor(secondsAgo / 60)}m`;
                        }}
                    />

                    <YAxis
                        tickLine={true}
                        axisLine={true}
                        tickMargin={8}
                        domain={[0, 'auto']}
                        tickFormatter={(value) => `${value}%`}
                    />

                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" hideLabel />}
                    />

                    <Area
                        dataKey="value"
                        type="monotone"
                        fill={chartConfig.value.color}
                        fillOpacity={0.4}
                        stroke={chartConfig.value.color}
                        // animationDuration={500} // Smooth 500ms animation
                        // animationEasing="ease-out" // Makes data slide in naturally
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
}

export default CPUChart;
