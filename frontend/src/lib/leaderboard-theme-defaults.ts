import { USER_THEME_DEFAULTS } from "@/lib/user-theme-defaults"

const leaderboardSpecific = {
  subtitle:
    "Track top players across PvP, farming, explosives, wipes, and server events — filter by server and wipe.",
  tableRowHighlightBg: "rgba(161, 161, 170, 0.2)",
} as const

const leaderboardAliases = {
  borderColor: USER_THEME_DEFAULTS.contentCardBorder,
  tabActiveBg: USER_THEME_DEFAULTS.tabActiveBackground,
  tabInactiveBg: USER_THEME_DEFAULTS.tabInactiveBackground,
  tabActiveText: USER_THEME_DEFAULTS.tabActiveText,
  tabInactiveText: USER_THEME_DEFAULTS.tabInactiveText,
  tableHeaderBg: USER_THEME_DEFAULTS.roleBadgeBackground,
  tableHeaderText: USER_THEME_DEFAULTS.contentCardTitleColor,
  tableRowBg: "transparent" as const,
  tableRowText: USER_THEME_DEFAULTS.contentCardTitleColor,
  tableSortHoverBg: USER_THEME_DEFAULTS.roleBadgeBackground,
  tableRowHoverBg: USER_THEME_DEFAULTS.roleBadgeBackground,
  paginationHoverBg: USER_THEME_DEFAULTS.profileDropdownItemHoverBackground,
  searchBg: USER_THEME_DEFAULTS.profileFilterBackground,
  searchBorder: USER_THEME_DEFAULTS.profileFilterBorder,
  searchText: USER_THEME_DEFAULTS.profileFilterTextColor,
  playerCountBg: USER_THEME_DEFAULTS.roleBadgeBackground,
  playerCountText: USER_THEME_DEFAULTS.contentCardTitleColor,
  titleColor: USER_THEME_DEFAULTS.primaryTitleColor,
  subtitleColor: USER_THEME_DEFAULTS.secondaryTextColor,
}

export const LEADERBOARD_THEME_DEFAULTS = {
  ...USER_THEME_DEFAULTS,
  ...leaderboardAliases,
  ...leaderboardSpecific,
} as const

export function withLeaderboardDefaults<T extends object | undefined | null>(
  serverTheme: T,
): T & typeof LEADERBOARD_THEME_DEFAULTS {
  if (serverTheme == null || typeof serverTheme !== "object" || Array.isArray(serverTheme)) {
    return { ...LEADERBOARD_THEME_DEFAULTS } as T & typeof LEADERBOARD_THEME_DEFAULTS
  }
  return { ...LEADERBOARD_THEME_DEFAULTS, ...serverTheme } as T & typeof LEADERBOARD_THEME_DEFAULTS
}
