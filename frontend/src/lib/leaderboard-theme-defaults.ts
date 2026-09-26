import { USER_THEME_DEFAULTS, withUserDefaults } from "@/lib/user-theme-defaults"

const cardBg = "rgba(8, 12, 17, 0.94)"
const cardBorder = "rgba(255, 255, 255, 0.1)"

export const LEADERBOARD_THEME_DEFAULTS = {
  ...USER_THEME_DEFAULTS,
  kickerLabel: "COMMUNITY / STATS",
  pageTitle: "LEADERBOARD",
  subtitle:
    "Track the players defining this wipe. Rankings update continuously across every server category.",
  pageSubtitle:
    "Track the players defining this wipe. Rankings update continuously across every server category.",
  kickerColor: "#ba9142",
  titleColor: "#f2f7ff",
  subtitleColor: "#b4c1d1",
  tableRowHighlightBg: "rgba(186, 145, 66, 0.12)",
  borderColor: cardBorder,
  tabActiveBg: "transparent",
  tabInactiveBg: "rgba(8, 12, 17, 0.84)",
  tabActiveText: "#f3d487",
  tabInactiveText: "#a7b4c4",
  tableHeaderBg: "rgba(3, 5, 8, 0.38)",
  tableHeaderText: "rgba(172, 190, 210, 0.62)",
  tableRowBg: "transparent",
  tableRowText: "#d8e2ed",
  tableSortHoverBg: "rgba(255, 255, 255, 0.04)",
  tableRowHoverBg: "rgba(255, 255, 255, 0.03)",
  paginationHoverBg: "rgba(255, 255, 255, 0.04)",
  searchBg: "rgba(8, 12, 17, 0.84)",
  searchBorder: "rgba(134, 157, 180, 0.18)",
  searchText: "#edf5ff",
  playerCountBg: "transparent",
  playerCountText: "rgba(159, 184, 207, 0.52)",
  cardBackground: cardBg,
  cardBorder: "rgba(91, 115, 142, 0.5)",
  cardBorderRadius: "0px",
  cardShadow: "none",
  cardPadding: "0px",
  sortedColumnColor: "#f0cc76",
  rankGoldColor: "#edca70",
  rankSilverColor: "#cbd8e7",
  rankBronzeColor: "#c58e61",
} as const

const STALE_LEADERBOARD_VALUES = new Set([
  "hsl(var(--background))",
  "hsl(var(--foreground))",
  "hsl(var(--card))",
  "hsl(var(--border))",
  "hsl(var(--muted-foreground))",
  "hsl(210, 40%, 98%)",
  "hsl(215, 20.2%, 65.1%)",
  "hsl(240, 4%, 46%)",
  "rgba(14, 16, 20, 0.85)",
  "rgba(161, 161, 170, 0.2)",
  "#ffffff",
  "#ef4444",
  "#b0b0b0",
  "0.5rem",
  "0.75rem",
  "0 4px 6px rgba(0, 0, 0, 0.2)",
  "track top players across pvp, farming, explosives, wipes, and server events — filter by server and wipe.",
  "track top players across pvp, farming, explosives, wipes, and server events.",
])

export function withLeaderboardDefaults<T extends object | undefined | null>(
  serverTheme: T,
): T & typeof LEADERBOARD_THEME_DEFAULTS {
  const base = withUserDefaults(
    serverTheme != null && typeof serverTheme === "object" && !Array.isArray(serverTheme)
      ? (serverTheme as object)
      : null,
  )
  const incoming = { ...(base as Record<string, unknown>) }
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string" && STALE_LEADERBOARD_VALUES.has(value.toLowerCase())) {
      delete incoming[key]
    }
  }
  if (
    incoming.cardBorderRadius === "0.5rem" ||
    incoming.cardBorderRadius === "0.75rem" ||
    incoming.cardBorderRadius === "0.375rem"
  ) {
    delete incoming.cardBorderRadius
  }
  return { ...LEADERBOARD_THEME_DEFAULTS, ...incoming } as T & typeof LEADERBOARD_THEME_DEFAULTS
}

export type LeaderboardTheme = typeof LEADERBOARD_THEME_DEFAULTS & Record<string, unknown>
