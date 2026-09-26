"use client";

import { LEADERBOARD_THEME_DEFAULTS, withLeaderboardDefaults } from "@/lib/leaderboard-theme-defaults";
import { useLeaderboardTheme } from "@/hooks/use-leaderboard-theme";

interface LeaderboardTitlesProps {
  serverTheme?: Record<string, unknown>;
  kicker?: string;
  nextWipeLabel?: string;
  lastUpdated?: string;
}

export function LeaderboardTitles({
  serverTheme,
  kicker,
  nextWipeLabel,
  lastUpdated,
}: LeaderboardTitlesProps) {
  const { data: clientTheme } = useLeaderboardTheme();
  const theme = withLeaderboardDefaults(clientTheme || serverTheme);
  const subtitle =
    (typeof theme.pageSubtitle === "string" && theme.pageSubtitle.trim()) ||
    (typeof theme.subtitle === "string" && theme.subtitle.trim()) ||
    LEADERBOARD_THEME_DEFAULTS.pageSubtitle;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[510px]">
        <p
          data-theme-field="kickerLabel"
          data-theme-label="Hero kicker"
          className="support-hero-kicker max-w-full truncate font-mono text-[10px] font-medium leading-[10px] tracking-[1.45px]"
        >
          {kicker || theme.kickerLabel || LEADERBOARD_THEME_DEFAULTS.kickerLabel}
        </p>
        <h1
          data-theme-field="pageTitle"
          data-theme-label="Hero title"
          className="support-hero-title pt-2.5 text-[40px] font-extrabold leading-[56px] tracking-[-2.9px] sm:text-[56px] lg:text-[62px]"
        >
          {theme.pageTitle || LEADERBOARD_THEME_DEFAULTS.pageTitle}
        </h1>
        <p
          data-theme-field="pageSubtitle"
          data-theme-label="Hero subtitle"
          className="support-hero-subtitle max-w-[510px] pt-4 text-[14px] leading-[22px]"
        >
          {subtitle}
        </p>
      </div>
      <div
        className="relative min-w-[184px] shrink-0 border px-[17px] py-[15px]"
        style={{
          borderColor: "rgba(186,145,66,0.38)",
          backgroundColor: "rgba(10,14,19,0.62)",
        }}
      >
        <p className="font-mono text-[9px] font-medium tracking-[1px] text-[#ba9142]">NEXT WIPE</p>
        <p className="pt-2 font-medium tracking-[0.6px] text-[#f0c970]">{nextWipeLabel || "—"}</p>
        <p className="pt-2 text-[9px] font-medium tracking-[1px] text-[rgba(189,204,220,0.62)]">
          {lastUpdated || "Last updated: just now"}
        </p>
      </div>
    </div>
  );
}
