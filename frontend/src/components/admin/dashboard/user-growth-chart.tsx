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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getUserGrowthStats,
  type UserGrowthPeriod,
  type UserGrowthStats,
} from "@/app/actions/dashboard"
import { useCallback, useEffect, useState } from "react"

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

const PERIOD_OPTIONS: { value: UserGrowthPeriod; label: string }[] = [
  { value: "1d", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "monthly", label: "Monthly" },
]

const PERIOD_DESCRIPTIONS: Record<UserGrowthPeriod, string> = {
  "1d": "Hourly user registration and Discord linking",
  "7d": "Daily user registration and Discord linking over the last week",
  "30d": "Daily user registration and Discord linking over the last 30 days",
  "90d": "Weekly user registration and Discord linking over the last 90 days",
  monthly: "Monthly user registration, Discord linking, and retention trends",
}

const PERIOD_TREND_LABELS: Record<UserGrowthPeriod, string> = {
  "1d": "the last hour",
  "7d": "the last day",
  "30d": "the last day",
  "90d": "the last week",
  monthly: "this month",
}

function formatXAxisTick(value: string, period: UserGrowthPeriod): string {
  if (period === "monthly") {
    return value.slice(0, 3)
  }
  if (period === "1d") {
    return value.replace(" ", "")
  }
  return value.length > 7 ? value.slice(0, 7) : value
}

export function UserGrowthChart() {
  const [period, setPeriod] = useState<UserGrowthPeriod>("monthly")
  const [data, setData] = useState<UserGrowthStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (selectedPeriod: UserGrowthPeriod) => {
    setIsLoading(true)
    setError(null)
    try {
      const stats = await getUserGrowthStats(selectedPeriod)
      setData(stats)
    } catch (err) {
      setError("Failed to load statistics")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  if (isLoading && data.length === 0) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="flex-row items-start space-y-0 pb-0">
          <div className="grid gap-1">
            <CardTitle>User Growth Analytics</CardTitle>
            <CardDescription>Loading user growth statistics...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center min-h-[300px]">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error && data.length === 0) {
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

  const currentPoint = data[data.length - 1]
  const previousPoint = data[data.length - 2]
  const userGrowth =
    currentPoint && previousPoint && previousPoint.newUsers > 0
      ? ((currentPoint.newUsers - previousPoint.newUsers) / previousPoint.newUsers) * 100
      : currentPoint?.newUsers && !previousPoint
        ? 100
        : 0

  const rangeLabel =
    data.length > 0
      ? `${data[0]?.label} – ${data[data.length - 1]?.label}`
      : ""

  return (
    <Card>
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>User Growth Analytics</CardTitle>
          <CardDescription>{PERIOD_DESCRIPTIONS[period]}</CardDescription>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as UserGrowthPeriod)}
        >
          <SelectTrigger
            className="ml-auto h-7 w-[150px] rounded-lg pl-2.5"
            aria-label="Select time period"
          >
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="rounded-lg"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className={isLoading ? "opacity-60" : undefined}>
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
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatXAxisTick(value, period)}
              interval={period === "1d" ? 2 : period === "30d" ? 4 : "preserveStartEnd"}
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
            <ChartTooltip content={<ChartTooltipContent />} />
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
                  Trending up by {userGrowth.toFixed(1)}% vs {PERIOD_TREND_LABELS[period]}{" "}
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </>
              ) : userGrowth < 0 ? (
                <>
                  Trending down by {Math.abs(userGrowth).toFixed(1)}% vs{" "}
                  {PERIOD_TREND_LABELS[period]}{" "}
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </>
              ) : (
                <>No change vs {PERIOD_TREND_LABELS[period]}</>
              )}
            </div>
            {rangeLabel ? (
              <div className="flex items-center gap-2 leading-none text-muted-foreground">
                {rangeLabel}
              </div>
            ) : null}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
