"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { getMonthlyStats } from "@/app/actions/dashboard"
import { useEffect, useState } from "react"
import { type MonthlyStats } from "@/app/actions/dashboard"

const chartConfig = {
  newUsers: {
    label: "New Users",
    color: "hsl(var(--chart-1))",
  },
  discordLinked: {
    label: "Discord Linked",
    color: "hsl(var(--chart-2))",
  },
  retentionRate: {
    label: "Retention Rate %",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function UserGrowthChart() {
  const [data, setData] = useState<MonthlyStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await getMonthlyStats()
        setData(stats)
      } catch (err) {
        setError("Failed to load statistics")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>User Growth Analytics</CardTitle>
          <CardDescription>Loading user growth statistics...</CardDescription>
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
          <CardTitle>User Growth Analytics</CardTitle>
          <CardDescription>Error loading user growth statistics</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center min-h-[300px]">
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }
  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  const userGrowth = previousMonth
    ? ((currentMonth.newUsers - previousMonth.newUsers) / previousMonth.newUsers) * 100
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth Analytics</CardTitle>
        <CardDescription>
          Monthly user registration, Discord linking, and retention trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-full w-full" config={chartConfig}>
          <AreaChart
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
            height={350}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="newUsers"
              stroke={chartConfig.newUsers.color}
              fill={chartConfig.newUsers.color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="discordLinked"
              stroke={chartConfig.discordLinked.color}
              fill={chartConfig.discordLinked.color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="retentionRate"
              stroke={chartConfig.retentionRate.color}
              fill={chartConfig.retentionRate.color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {userGrowth > 0 ? (
                <>
                  Trending up by {userGrowth.toFixed(1)}% this month{" "}
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <>
                  Trending down by {Math.abs(userGrowth).toFixed(1)}% this month{" "}
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </>
              )}
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
