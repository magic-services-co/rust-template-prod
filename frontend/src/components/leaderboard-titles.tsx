"use client";

import { useLeaderboardTheme } from "@/hooks/use-leaderboard-theme";
import { withLeaderboardDefaults } from "@/lib/leaderboard-theme-defaults";

const LEADERBOARD_SUBTITLE_FALLBACK =
  "Track top players across PvP, farming, explosives, wipes, and server events.";

interface LeaderboardTitlesProps {
  serverTheme?: any;
  /** Tighter hero for dashboard-style leaderboard layout. */
  compact?: boolean;
}

/** Matches {@link BansTitles} structure and token names (`titleTextColor`, `textSecondaryColor`, etc.). */
export function LeaderboardTitles({ serverTheme, compact }: LeaderboardTitlesProps) {
  const { data: clientTheme } = useLeaderboardTheme();
  const theme = withLeaderboardDefaults(clientTheme || serverTheme);
  const subtitle =
    typeof theme.subtitle === "string" && theme.subtitle.trim() !== ""
      ? theme.subtitle
      : LEADERBOARD_SUBTITLE_FALLBACK;

  if (compact) {
    return (
      <div className="border-b border-border pb-4 text-left">
        <h1
          className="text-2xl font-bold tracking-tight text-white md:text-3xl"
          style={{ color: theme.titleTextColor }}
        >
          Leaderboard
        </h1>
        <p
          className="mt-1 max-w-[70ch] text-sm leading-relaxed md:text-base"
          style={{ color: theme.textSecondaryColor }}
        >
          {subtitle}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pb-8 text-center">
      <h1
        className="mt-2 text-center text-4xl font-bold"
        style={{
          color: theme.titleTextColor,
          backgroundColor: theme.titleBackgroundColor,
          border: theme.titleBorderColor ? `1px solid ${theme.titleBorderColor}` : "none",
          borderRadius: theme.titleBorderRadius,
          padding: theme.titleBorderColor ? "1rem" : "0",
        }}
      >
        Leaderboard
      </h1>
      <p
        className="max-w-[80ch] px-8 text-center leading-8 lg:px-0 mt-4"
        style={{ color: theme.textSecondaryColor }}
      >
        {subtitle}
      </p>
    </div>
  );
}
