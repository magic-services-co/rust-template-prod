"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsInteger, parseAsBoolean } from "nuqs";
import { useDebouncedCallback } from "use-debounce";
import { StatsTable } from "./stats-table";
import { useLeaderboardTabs } from "@/hooks/use-leaderboard-tabs";
import { useLeaderboardTheme } from "@/hooks/use-leaderboard-theme";
import { LeaderboardSkeleton } from "./leaderboard-skeleton";
import { withLeaderboardDefaults } from "@/lib/leaderboard-theme-defaults";
import { LeaderboardTabIcon } from "./leaderboard-tab-icon";
import { LeaderboardEventMapSection } from "./leaderboard-event-map-section";
import useServerData from "@/hooks/use-server-data";
import { useWipes } from "@/hooks/use-wipes";
import { useLeaderboardSettings } from "@/hooks/use-leaderboard-settings";
import { ServerCombobox } from "@/components/server-combobox";
import { WipeCombobox } from "@/components/wipe-combobox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Crown,
  ExternalLink,
  Flame,
  Lock,
  Search,
  Sparkles,
} from "lucide-react";
import { formatDistanceStrict } from "date-fns";
import { cn } from "@/lib/utils";

interface StatsTableContainerProps {
  leaderboardTheme?: any;
}

const ACCENT = "#ef4444";

export function StatsTableContainer({ leaderboardTheme: serverTheme }: StatsTableContainerProps) {
  const { data: tabs, isLoading, error } = useLeaderboardTabs();
  const { data: clientTheme } = useLeaderboardTheme();
  const { data: leaderboardSettings } = useLeaderboardSettings();
  const { serverList, isLoading: serversLoading } = useServerData();

  const [activeTab, setActiveTab] = useQueryState("tab");
  const [selectedServer, setSelectedServer] = useQueryState("server");
  const [selectedWipeId, setSelectedWipeId] = useQueryState("wipeId", parseAsInteger);
  const [lockSort, setLockSort] = useQueryState("lockSort", parseAsBoolean.withDefault(false));
  const [searchQuery, setSearchQuery] = useQueryState("filter", {
    defaultValue: "",
    shallow: false,
    clearOnDefault: true,
  });

  const debouncedSetSearch = useDebouncedCallback((v: string) => setSearchQuery(v || null), 300);
  const [searchLocal, setSearchLocal] = useState(searchQuery ?? "");
  useEffect(() => {
    setSearchLocal(searchQuery ?? "");
  }, [searchQuery]);

  const theme = withLeaderboardDefaults(clientTheme || serverTheme);
  const showWipeSelection = leaderboardSettings?.showWipeSelection ?? true;
  const lifetime = !showWipeSelection || selectedWipeId === -1;

  const { data: wipesData } = useWipes(selectedServer ?? undefined, false);
  const wipes = wipesData?.data ?? [];

  const currentServerMeta = useMemo(() => {
    if (!selectedServer) return null;
    for (const q of serverList) {
      const s = q.data;
      if (!s) continue;
      if (s.server_id === selectedServer || s.id === selectedServer) return s;
    }
    return null;
  }, [selectedServer, serverList]);

  const wipeSummary = useMemo(() => {
    if (lifetime) return "Lifetime";
    const w = wipes.find((x) => x.id === selectedWipeId);
    if (!w?.started_at) return "Current wipe";
    try {
      return formatDistanceStrict(new Date(w.started_at), new Date(), { addSuffix: true });
    } catch {
      return "Current wipe";
    }
  }, [wipes, selectedWipeId, lifetime]);

  const playersLabel = currentServerMeta
    ? `${currentServerMeta.attributes.players} / ${currentServerMeta.attributes.maxPlayers || "—"}`
    : "—";

  const serverTitle =
    currentServerMeta?.attributes.name ?? currentServerMeta?.name ?? "Select server";

  const inputStyle = {
    backgroundColor: theme.inputBackground,
    border: theme.inputBorder ? `1px solid ${theme.inputBorder}` : undefined,
    color: theme.inputTextColor,
    borderRadius: theme.inputBorderRadius,
  } as React.CSSProperties;

  const comboboxTriggerClass =
    "w-full justify-between h-9 px-3 py-2 text-sm border shadow-none ring-offset-background";

  if (isLoading || error) return <LeaderboardSkeleton />;

  return (
    <div className="space-y-0" style={{ color: theme.textPrimaryColor }}>
      {/* Header strip — server, quick stats, wipe / lifetime */}
      <header className="mb-4 rounded-lg border border-border p-4 md:p-5 bg-transparent">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2
              className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-xl font-bold tracking-tight text-white md:text-2xl"
              style={{ color: theme.titleTextColor }}
            >
              <span className="min-w-0 truncate">{serverTitle}</span>
              <span className="shrink-0 font-semibold opacity-80">· Leaderboard</span>
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
                  String(currentServerMeta?.attributes.status).toLowerCase() === "online"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-500/20 text-zinc-400",
                )}
              >
                {serversLoading
                  ? "…"
                  : String(currentServerMeta?.attributes.status).toLowerCase() === "online"
                    ? "Server online"
                    : "Status unknown"}
              </span>
              {currentServerMeta?.server_address ? (
                <a
                  href={`steam://connect/${currentServerMeta.server_address}`}
                  className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300 hover:bg-sky-500/25"
                >
                  Connect <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:max-w-md lg:max-w-lg">
            <div className="rounded-md border border-border px-3 py-2 text-center bg-transparent">
              <div className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-violet-300/90">
                <Sparkles className="h-3 w-3" />
                Gather
              </div>
              <div className="mt-1 text-sm font-semibold text-white">—</div>
            </div>
            <div className="rounded-md border border-border px-3 py-2 text-center bg-transparent">
              <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Wiped
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{wipeSummary}</div>
            </div>
            <div className="rounded-md border border-border px-3 py-2 text-center bg-transparent">
              <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-400/90">
                Players
              </div>
              <div className="mt-1 text-sm font-semibold text-white">{playersLabel}</div>
            </div>
          </div>
        </div>

        {showWipeSelection ? (
          <div className="mt-4 flex border-t border-border pt-4">
            <div className="flex w-full gap-1 rounded-md border border-border/60 bg-transparent p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const w = wipes.find((x) => x.is_active) ?? wipes[0];
                  setSelectedWipeId(w?.id ?? null);
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
                  !lifetime
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
                style={
                  !lifetime
                    ? {
                        boxShadow: `inset 0 -2px 0 0 ${ACCENT}`,
                        background: "rgba(239,68,68,0.08)",
                      }
                    : undefined
                }
              >
                <Flame className="h-4 w-4 text-red-400" />
                Current wipe
              </button>
              <button
                type="button"
                onClick={() => setSelectedWipeId(-1)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors sm:flex-none",
                  lifetime ? "text-white" : "text-zinc-500 hover:text-zinc-300",
                )}
                style={
                  lifetime
                    ? {
                        boxShadow: `inset 0 -2px 0 0 ${ACCENT}`,
                        background: "rgba(234,179,8,0.1)",
                      }
                    : undefined
                }
              >
                <Crown className="h-4 w-4 text-amber-400" />
                Lifetime
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <ServerCombobox
            allowGlobal={false}
            value={selectedServer}
            triggerClassName={comboboxTriggerClass}
            triggerStyle={inputStyle}
            onChange={(v) => setSelectedServer(v)}
          />
          {showWipeSelection && selectedServer ? (
            <WipeCombobox
              value={selectedWipeId}
              onChange={(id) => setSelectedWipeId(id)}
              serverId={selectedServer}
              showLifetime={true}
              triggerClassName={comboboxTriggerClass}
              triggerStyle={inputStyle}
            />
          ) : (
            <div
              className="flex h-9 items-center rounded-md border px-3 text-sm text-zinc-500"
              style={{
                borderColor: theme.inputBorder,
                borderRadius: theme.inputBorderRadius,
              }}
            >
              {selectedServer ? "" : "Select a server for wipes"}
            </div>
          )}
        </div>
      </header>

      <LeaderboardEventMapSection
        activeTab={activeTab ?? tabs?.[0]?.tabKey ?? "pvp_stats"}
        selectedServer={selectedServer}
        selectedWipeId={selectedWipeId}
        lifetime={lifetime}
      />

      {/* pt-*: space-y-0 on parent zeros sibling margin-top; padding gives a real gap below Event map */}
      <div className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-start lg:gap-8 lg:pt-10">
        {/* Mobile / horizontal tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs?.map((tab) => {
            const selected =
              activeTab === tab.tabKey || (!activeTab && tab.tabKey === tabs?.[0]?.tabKey);
            return (
              <button
                key={tab.tabKey}
                type="button"
                onClick={() => setActiveTab(tab.tabKey)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium whitespace-nowrap",
                  selected ? "border-red-500/50 bg-red-500/10 text-white" : "border-white/10 text-zinc-400",
                )}
              >
                <LeaderboardTabIcon tabKey={tab.tabKey} className="h-4 w-4" />
                {tab.tabLabel}
              </button>
            );
          })}
        </div>

        {/* Desktop category rail */}
        <aside className="hidden w-full overflow-hidden rounded-lg border border-border bg-transparent lg:flex lg:w-[220px] lg:max-w-[220px] lg:shrink-0 lg:flex-col lg:gap-1">
          <div className="border-b border-border px-3 py-2.5 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Categories
          </div>
          <nav className="flex flex-col gap-0.5 p-2">
            {tabs?.map((tab) => {
              const selected =
                activeTab === tab.tabKey || (!activeTab && tab.tabKey === tabs?.[0]?.tabKey);
              return (
                <button
                  key={tab.tabKey}
                  type="button"
                  onClick={() => setActiveTab(tab.tabKey)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    selected
                      ? "bg-red-500/15 text-red-100"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
                  )}
                >
                  <LeaderboardTabIcon
                    tabKey={tab.tabKey}
                    className={cn("h-4 w-4 shrink-0", selected ? "text-red-400" : "text-zinc-500")}
                  />
                  <span className="truncate">{tab.tabLabel}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-border p-3 text-[11px] leading-relaxed text-zinc-500">
            Use{" "}
            <span className="font-medium text-zinc-400">Lifetime</span> to rank across all wipes for
            this server.
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-3 lg:min-w-0">
          {/* Search + lock — directly above table headers */}
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-transparent px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                type="search"
                value={searchLocal}
                placeholder="Search player by Name or Steam ID"
                className="h-11 pl-10 placeholder:text-muted-foreground"
                style={inputStyle}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchLocal(v);
                  debouncedSetSearch(v);
                }}
              />
            </div>
            <div className="flex items-center justify-end gap-3 sm:shrink-0">
              <Lock
                className={cn("h-4 w-4", lockSort ? "text-red-400" : "text-zinc-600")}
                aria-hidden
              />
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <span>Lock sorting</span>
                <Switch
                  checked={lockSort === true}
                  onCheckedChange={(v) => setLockSort(v)}
                  className="data-[state=checked]:border-red-500/50 data-[state=checked]:bg-red-600"
                />
              </label>
            </div>
          </div>

          {tabs?.map((tab) => {
            const isActive =
              activeTab === tab.tabKey ||
              (!activeTab && tab.tabKey === tabs?.[0]?.tabKey);
            return (
              <div key={tab.tabKey} className={cn(!isActive && "hidden")}>
                <StatsTable
                  tab={tab.tabKey}
                  columnData={tab.columns}
                  leaderboardTheme={theme as any}
                  isActive={isActive}
                  hideFilterCard
                  lockSort={lockSort === true}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
