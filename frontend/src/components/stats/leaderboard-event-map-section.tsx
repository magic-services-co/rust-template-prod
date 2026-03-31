"use client";

import { useCallback, useState } from "react";
import { Map, RefreshCw, ScrollText } from "lucide-react";
import { LeaderboardHeatmapMap } from "./leaderboard-heatmap-map";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MOCK_FEED = [
  { id: "1", text: "Bradley APC has spawned at Launch Site", time: "10:51:02 AM" },
  { id: "2", text: "Cargo Ship has spawned", time: "10:48:17 AM" },
  { id: "3", text: "Locked crate unlocked at Military Tunnel", time: "10:44:55 AM" },
  { id: "4", text: "Helicopter signal detected — grid G19", time: "10:39:12 AM" },
  { id: "5", text: "Oil Rig Small captured", time: "10:31:08 AM" },
  { id: "6", text: "Chinook crate inbound", time: "10:22:41 AM" },
];

function ControlPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/20 p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export type LeaderboardEventMapSectionProps = {
  activeTab: string;
  selectedServer: string | null;
  selectedWipeId?: number | null;
  lifetime?: boolean;
};

export function LeaderboardEventMapSection({
  activeTab: _activeTab,
  selectedServer: _selectedServer,
  selectedWipeId: _selectedWipeId,
  lifetime: _lifetime,
}: LeaderboardEventMapSectionProps) {
  const [showPlayers, setShowPlayers] = useState(true);
  const [showCupboards, setShowCupboards] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [mapRemountKey, setMapRemountKey] = useState(0);

  const refreshMap = useCallback(() => {
    setMapRemountKey((k) => k + 1);
  }, []);

  return (
    <section
      className="rounded-xl border border-border bg-card/10 p-3 shadow-sm sm:p-4"
      aria-label="Event map"
    >
      <div className="mb-3 flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 shrink-0 text-red-500" aria-hidden />
          <h2 className="text-base font-semibold tracking-tight text-foreground">Event map</h2>
        </div>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          Kill heat overlay when server data is available — pan and zoom to inspect
        </span>
      </div>

      {/* Side columns grow with viewport; center stays a fixed square (≤560px) so map isn’t floating in empty space */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,560px)_minmax(0,1.45fr)] lg:items-start">
        {/* Left — controls */}
        <div className="flex min-w-0 w-full flex-col gap-3">
          <ControlPanel title="Controls">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="lb-map-players"
                  checked={showPlayers}
                  onCheckedChange={(v) => setShowPlayers(v === true)}
                />
                <Label htmlFor="lb-map-players" className="text-sm font-normal cursor-pointer">
                  Players
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="lb-map-cupboards"
                  checked={showCupboards}
                  onCheckedChange={(v) => setShowCupboards(v === true)}
                />
                <Label htmlFor="lb-map-cupboards" className="text-sm font-normal cursor-pointer">
                  Cupboards
                </Label>
              </div>
            </div>
          </ControlPanel>

          <ControlPanel
            title="Heatmap"
            action={
              <Switch
                checked={heatmapOn}
                onCheckedChange={setHeatmapOn}
                className="data-[state=checked]:bg-red-600"
                aria-label="Toggle kill heat overlay"
              />
            }
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              When kill location data is wired in, hotspots render on the map. Toggle off to hide the overlay.
            </p>
          </ControlPanel>
        </div>

        {/* Center — square map only as wide as this column (no extra gutters) */}
        <div className="relative w-full min-w-0 max-w-[560px] justify-self-center lg:max-w-full">
          <div className="absolute right-2 top-2 z-30 flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 border border-border bg-background/95 shadow-sm backdrop-blur-sm"
              onClick={refreshMap}
              title="Reset map view"
              aria-label="Refresh map"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-background/95 px-2 py-1 shadow-sm backdrop-blur-sm">
              <Switch
                id="lb-map-autorefresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                className="scale-90"
              />
              <Label htmlFor="lb-map-autorefresh" className="cursor-pointer text-[10px] text-muted-foreground">
                Live
              </Label>
            </div>
          </div>

          <LeaderboardHeatmapMap
            key={mapRemountKey}
            className="w-full min-h-[280px]"
            showHeatmap={heatmapOn}
            killPoints={[]}
          />
        </div>

        {/* Right — event feed */}
        <div className="flex min-h-0 min-w-0 w-full flex-col rounded-lg border border-border bg-card/20 p-1 shadow-sm sm:p-2">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <ScrollText className="h-4 w-4 text-red-500" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Event feed</h3>
          </div>
          <ul className="max-h-[min(70vh,560px)] min-h-[280px] flex-1 space-y-2 overflow-y-auto p-2 pr-1 [scrollbar-gutter:stable] lg:min-h-[520px]">
            {MOCK_FEED.map((ev, i) => (
              <li
                key={ev.id}
                className={cn(
                  "rounded-md border border-border/60 bg-background/30 px-3 py-2.5 text-sm",
                  i % 2 === 1 && "bg-muted/20",
                )}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                  <p className="min-w-0 flex-1 leading-snug text-foreground">{ev.text}</p>
                  <time
                    className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums"
                    dateTime=""
                  >
                    {ev.time}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
