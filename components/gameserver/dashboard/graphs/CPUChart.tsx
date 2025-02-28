"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, } from "@/components/ui/chart"

interface CPUData {
    time: number,
    value: number,
}


const chartData: CPUData[] = [
    { time: 1, value: 10 },
    { time: 2, value: 13 },
    { time: 3, value: 90 },
    { time: 4, value: 92 },
    { time: 5, value: 95 },
    { time: 6, value: 100 },
    { time: 7, value: 10 },
    { time: 8, value: 11 },
    { time: 9, value: 9 },
    { time: 10, value: 8 },
]


const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

function CPUChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="time"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            // tickFormatter={(value) => value.slice(0, 3)}
                            domain={['dataMin', 'dataMax']}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="value"
                            type="monotone"
                            fill={chartConfig.desktop.color}
                            fillOpacity={0.4}
                            stroke={chartConfig.desktop.color}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}


export default CPUChart;