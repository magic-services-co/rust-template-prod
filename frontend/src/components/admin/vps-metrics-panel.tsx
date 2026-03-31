"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
  Pause,
  Play,
  Server,
} from "lucide-react";

const POLL_MS = 2500;
const API_URL = "/api/admin/system-control/metrics";
/** Rolling window of samples (~4 min at 2.5s interval). */
const MAX_HISTORY = 96;

type HistoryPoint = {
  seq: number;
  at: number;
  cpu?: number;
  memory?: number;
  disk?: number;
  load1?: number;
};

const percentChartConfig = {
  cpu: { label: "CPU %", color: "hsl(var(--chart-1))" },
  memory: { label: "Memory %", color: "hsl(var(--chart-2))" },
  disk: { label: "Disk %", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

const loadChartConfig = {
  load1: { label: "Load 1m", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

type CpuBlock = { cores: number; usage_percent: number } | null;
type MemoryBlock = {
  total_bytes: number;
  used_bytes: number;
  available_bytes: number | null;
  usage_percent: number;
} | null;
type DiskBlock = {
  path: string;
  total_bytes: number | null;
  free_bytes: number | null;
  used_bytes: number | null;
  usage_percent: number | null;
};

export type VpsMetricsPayload = {
  platform: string;
  timestamp: number;
  hostname: string;
  linux: boolean;
  uptime_seconds: number | null;
  load_average: number[] | null;
  cpu: CpuBlock;
  memory: MemoryBlock;
  disk: DiskBlock;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let u = 0;
  let n = bytes;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  return `${n < 10 && u > 0 ? n.toFixed(1) : Math.round(n)} ${units[u]}`;
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h || d) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function MetricRow({
  label,
  value,
  sub,
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  progress?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
          <span>{label}</span>
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">{value}</span>
      </div>
      {progress !== undefined && (
        <Progress value={Math.min(100, Math.max(0, progress))} className="h-2" />
      )}
      {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
    </div>
  );
}

export function VpsMetricsPanel() {
  const [live, setLive] = useState(true);
  const [data, setData] = useState<VpsMetricsPayload | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(API_URL, {
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
      });
      if (res.status === 401) {
        setError("You must be signed in as an admin to view host metrics.");
        setData(null);
        setHistory([]);
        return;
      }
      if (!res.ok) {
        setError("Could not load VPS metrics.");
        setData(null);
        return;
      }
      const json = (await res.json()) as VpsMetricsPayload;
      setData(json);
      setHistory((prev) => {
        const diskPct =
          json.disk.total_bytes != null && json.disk.usage_percent != null
            ? json.disk.usage_percent
            : undefined;
        const point: HistoryPoint = {
          seq: prev.length ? prev[prev.length - 1].seq + 1 : 0,
          at: Date.now(),
          cpu: json.cpu?.usage_percent,
          memory: json.memory?.usage_percent,
          disk: diskPct,
          load1: json.load_average?.[0],
        };
        return [...prev, point].slice(-MAX_HISTORY);
      });
      setError(null);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError("Could not load VPS metrics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!live) return;
    const ac = new AbortController();
    void fetchMetrics(ac.signal);
    const id = window.setInterval(() => {
      void fetchMetrics();
    }, POLL_MS);
    return () => {
      ac.abort();
      window.clearInterval(id);
    };
  }, [live, fetchMetrics]);

  const hasLoadSeries = useMemo(
    () => history.some((p) => p.load1 != null && Number.isFinite(p.load1)),
    [history]
  );

  const historyWindowLabel = useMemo(() => {
    const m = (MAX_HISTORY * POLL_MS) / 60_000;
    return m < 1 ? `${Math.round(MAX_HISTORY * (POLL_MS / 1000))}s` : `${Math.round(m)} min`;
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Machine Performance
          </CardTitle>
          <CardDescription>
            Live stats from the server running this app (refreshes every {POLL_MS / 1000}s). Graphs keep
            the last ~{historyWindowLabel} of samples.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="vps-live" checked={live} onCheckedChange={setLive} />
            <Label htmlFor="vps-live" className="cursor-pointer text-sm">
              {live ? "Live" : "Paused"}
            </Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchMetrics()}
            disabled={loading && !data}
          >
            {live ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !data && !error && (
          <p className="text-muted-foreground text-sm">Loading metrics…</p>
        )}

        {data && (
          <>
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                <span className="font-medium text-foreground">{data.hostname}</span>
              </span>
              <span>{data.platform}</span>
              {data.uptime_seconds != null && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Up {formatUptime(data.uptime_seconds)}
                </span>
              )}
            </div>

            {history.length >= 2 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Usage (%)
                  </p>
                  <ChartContainer config={percentChartConfig} className="aspect-auto h-[220px] w-full">
                    <AreaChart
                      data={history}
                      margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="seq"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tickFormatter={() => ""}
                      />
                      <YAxis
                        domain={[0, 100]}
                        width={36}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(v) => `${v}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_value, payload) => {
                              const row = payload?.[0]?.payload as HistoryPoint | undefined;
                              if (!row?.at) return "";
                              return new Date(row.at).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              });
                            }}
                          />
                        }
                      />
                      {data.cpu && (
                        <Area
                          type="monotone"
                          dataKey="cpu"
                          name="cpu"
                          stroke={percentChartConfig.cpu.color}
                          fill={percentChartConfig.cpu.color}
                          fillOpacity={0.15}
                          strokeWidth={2}
                          connectNulls
                        />
                      )}
                      {data.memory && (
                        <Area
                          type="monotone"
                          dataKey="memory"
                          name="memory"
                          stroke={percentChartConfig.memory.color}
                          fill={percentChartConfig.memory.color}
                          fillOpacity={0.15}
                          strokeWidth={2}
                          connectNulls
                        />
                      )}
                      {data.disk.total_bytes != null && data.disk.usage_percent != null && (
                        <Area
                          type="monotone"
                          dataKey="disk"
                          name="disk"
                          stroke={percentChartConfig.disk.color}
                          fill={percentChartConfig.disk.color}
                          fillOpacity={0.15}
                          strokeWidth={2}
                          connectNulls
                        />
                      )}
                      <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                  </ChartContainer>
                </div>

                {hasLoadSeries && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Load average (1m)
                    </p>
                    <ChartContainer config={loadChartConfig} className="aspect-auto h-[220px] w-full">
                      <AreaChart
                        data={history}
                        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="seq"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={32}
                          tickFormatter={() => ""}
                        />
                        <YAxis
                          width={40}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          domain={[0, "auto"]}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              labelFormatter={(_value, payload) => {
                                const row = payload?.[0]?.payload as HistoryPoint | undefined;
                                if (!row?.at) return "";
                                return new Date(row.at).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                });
                              }}
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="load1"
                          name="load1"
                          stroke={loadChartConfig.load1.color}
                          fill={loadChartConfig.load1.color}
                          fillOpacity={0.2}
                          strokeWidth={2}
                          connectNulls
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                )}
              </div>
            )}

            {history.length === 1 && (
              <p className="text-muted-foreground text-xs">One more refresh to start the graphs…</p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {data.cpu && (
                <MetricRow
                  label="CPU"
                  icon={Cpu}
                  value={`${data.cpu.usage_percent}%`}
                  sub={`${data.cpu.cores} logical CPU(s)`}
                  progress={data.cpu.usage_percent}
                />
              )}

              {data.memory && (
                <MetricRow
                  label="Memory"
                  icon={MemoryStick}
                  value={`${data.memory.usage_percent}% used`}
                  sub={`${formatBytes(data.memory.used_bytes)} / ${formatBytes(data.memory.total_bytes)}`}
                  progress={data.memory.usage_percent}
                />
              )}

              {data.disk.total_bytes != null && data.disk.usage_percent != null && (
                <MetricRow
                  label={`Disk (${data.disk.path})`}
                  icon={HardDrive}
                  value={`${data.disk.usage_percent}% used`}
                  sub={
                    data.disk.free_bytes != null
                      ? `${formatBytes(data.disk.free_bytes)} free of ${formatBytes(data.disk.total_bytes!)}`
                      : undefined
                  }
                  progress={data.disk.usage_percent}
                />
              )}

              {data.load_average && data.load_average.length >= 3 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Gauge className="text-muted-foreground h-4 w-4" />
                    Load average
                  </div>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {data.load_average[0]} <span className="text-xs">(1m)</span>
                    {" · "}
                    {data.load_average[1]} <span className="text-xs">(5m)</span>
                    {" · "}
                    {data.load_average[2]} <span className="text-xs">(15m)</span>
                  </p>
                  {data.cpu && (
                    <p className="text-muted-foreground text-xs">
                      Load per core ≈ {(data.load_average[0] / Math.max(1, data.cpu.cores)).toFixed(2)} (1m /{" "}
                      {data.cpu.cores} cores)
                    </p>
                  )}
                </div>
              )}
            </div>

            {!data.linux && (
              <p className="text-muted-foreground text-xs">
                CPU and memory charts need Linux (/proc). Load and disk may still be available on this OS.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
