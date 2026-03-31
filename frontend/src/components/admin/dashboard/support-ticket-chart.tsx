"use client"

import { Label, Pie, PieChart } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getTicketStats, type TicketStats } from "@/app/actions/dashboard"
import { useEffect, useMemo, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
]

export function SupportTicketChart() {
    const [data, setData] = useState<TicketStats[]>([])
    const [activeMonth, setActiveMonth] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stats = await getTicketStats()
                setData(stats)
                setActiveMonth(stats[stats.length - 1]?.month || "")
            } catch (err) {
                setError("Failed to load ticket statistics")
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const activeIndex = useMemo(
        () => data.findIndex((item) => item.month === activeMonth),
        [activeMonth, data]
    )

    const currentMonthData = useMemo(() => {
        if (!data[activeIndex]) return null
        const { categories } = data[activeIndex]
        
        const groupedCategories = categories.reduce((acc, { name, count }) => {
            acc[name] = (acc[name] || 0) + count;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(groupedCategories).map(([name, count], index) => ({
            name,
            value: count,
            fill: chartColors[index % chartColors.length],
        }));
    }, [activeIndex, data])

    if (isLoading) {
        return (
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Support Tickets Overview</CardTitle>
                    <CardDescription>Loading ticket statistics...</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 items-center justify-center min-h-[300px]">
                    <div className="text-muted-foreground">Loading...</div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Support Tickets Overview</CardTitle>
                    <CardDescription>Error loading ticket statistics</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 items-center justify-center min-h-[300px]">
                    <div className="text-destructive">{error}</div>
                </CardContent>
            </Card>
        )
    }

    const activeData = data[activeIndex]
    if (!activeData || !currentMonthData) {
        return (
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Support Tickets Overview</CardTitle>
                    <CardDescription>No data available</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 items-center justify-center min-h-[300px]">
                    <div className="text-muted-foreground">No ticket data available for this period</div>
                </CardContent>
            </Card>
        )
    }

    if (currentMonthData.length === 0) {
        return (
            <Card className="flex flex-col h-full">
                <CardHeader className="flex-row items-start space-y-0 pb-0">
                    <div className="grid gap-1">
                        <CardTitle>Support Tickets Overview</CardTitle>
                        <CardDescription>Monthly ticket statistics</CardDescription>
                    </div>
                    <Select value={activeMonth} onValueChange={setActiveMonth}>
                        <SelectTrigger
                            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
                            aria-label="Select month"
                        >
                            <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent align="end" className="rounded-xl">
                            {data.map((item) => (
                                <SelectItem
                                    key={item.month}
                                    value={item.month}
                                    className="rounded-lg [&_span]:flex"
                                >
                                    <div className="flex items-center gap-2 text-xs">
                                        {item.month}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="flex flex-1 items-center justify-center min-h-[300px]">
                    <div className="text-muted-foreground">No tickets found for {activeMonth}</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-row items-start space-y-0 pb-0">
                <div className="grid gap-1">
                    <CardTitle>Support Tickets Overview</CardTitle>
                    <CardDescription>Monthly ticket statistics</CardDescription>
                </div>
                <Select value={activeMonth} onValueChange={setActiveMonth}>
                    <SelectTrigger
                        className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
                        aria-label="Select month"
                    >
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent align="end" className="rounded-xl">
                        {data.map((item) => (
                            <SelectItem
                                key={item.month}
                                value={item.month}
                                className="rounded-lg [&_span]:flex"
                            >
                                <div className="flex items-center gap-2 text-xs">
                                    {item.month}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="relative flex flex-1 justify-center h-full pb-0">
                <ChartContainer
                    config={Object.fromEntries(
                        currentMonthData.map(({ name }, index) => [
                            name,
                            {
                                label: name,
                                color: chartColors[index % chartColors.length],
                            },
                        ])
                    )}
                    className="mx-auto aspect-square h-full w-full"
                >
                    <PieChart>
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                        />
                        <Pie
                            data={currentMonthData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={"60%"}
                            outerRadius={"95%"}
                            paddingAngle={2}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        const cy = viewBox.cy || 0;
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={cy - 20}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {activeData.total.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={cy + 10}
                                                    className="fill-muted-foreground text-sm"
                                                >
                                                    Total Tickets
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={cy + 30}
                                                    className="fill-muted-foreground text-xs"
                                                >
                                                    {activeData.avgResponseTime}h avg. response
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            {(() => {
                                const currentMonth = data[activeIndex];
                                const previousMonth = data[activeIndex - 1];
                                if (!previousMonth) return null;

                                const growth = previousMonth.total > 0
                                    ? ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100
                                    : currentMonth.total > 0 ? 100 : 0;

                                return growth > 0 ? (
                                    <>
                                        Trending up by {growth.toFixed(1)}% this month{" "}
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </>
                                ) : (
                                    <>
                                        Trending down by {Math.abs(growth).toFixed(1)}% this month{" "}
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                    </>
                                );
                            })()}
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            {data[0]?.month} - {data[data.length - 1]?.month} {new Date().getFullYear()}
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
