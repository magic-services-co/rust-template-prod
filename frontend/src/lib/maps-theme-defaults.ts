const cardBg = "rgba(8, 12, 17, 0.94)";
const cardBorder = "rgba(255,255,255,0.12)";

export const MAPS_THEME_DEFAULTS = {
  kickerLabel: "COMMUNITY / MAPS",
  pageTitle: "MAP VOTES",
  pageSubtitle: "Browse active and past map votes, then pick the next wipe.",
  kickerColor: "#ba9142",
  titleColor: "#f2f7ff",
  subtitleColor: "#9facc0",
  backgroundColor: "transparent",
  searchInputBackground: "#070a0e",
  searchInputBorder: "rgba(255,255,255,0.1)",
  searchInputText: "#eef4fb",
  searchInputPlaceholder: "#708195",
  searchInputFocusBorder: "#ba9142",
  sectionTitleColor: "#eef4fb",
  sectionTitleSize: "28px",
  mapCardBackground: cardBg,
  mapCardBorder: cardBorder,
  mapCardHoverBackground: cardBg,
  mapCardTitleColor: "#f2f7ff",
  mapCardServerNameColor: "#eef4fb",
  mapCardStatusTextColor: "#a5b1bb",
  mapCardStatusActiveColor: "#d6a850",
  mapCardStatusInactiveColor: "#8292a6",
  mapCardStatusUpcomingColor: "#d6a850",
  mapCardVoteCountBackground: "transparent",
  mapCardVoteCountText: "#f2f7ff",
  mapCardBadgeActiveBackground: "rgba(24,20,10,0.85)",
  mapCardBadgeActiveText: "#e6bb60",
  buttonPrimaryBackground: "transparent",
  buttonPrimaryText: "#d6a850",
  buttonPrimaryHoverBackground: "rgba(214,168,80,0.12)",
  buttonSecondaryBackground: "transparent",
  buttonSecondaryText: "#a5b1bb",
  buttonSecondaryBorder: "rgba(255,255,255,0.2)",
  buttonSecondaryHoverBackground: "rgba(255,255,255,0.04)",
  buttonBorderRadius: "0px",
  cardBorderRadius: "0px",
  cardPadding: "24px",
  cardShadow: "none",
  spacing: "20px",
  cardHoverEffect: "",
  loadingSkeletonBackground: "rgba(255,255,255,0.06)",
  errorTextColor: "#e8a0a3",
  errorBackground: "rgba(141,37,42,0.16)",
  errorBorder: "#8d252a",
} as const;

const STALE = new Set([
  "rgba(15,20,25,0.1)",
  "rgba(255, 255, 255, 0.05)",
  "rgba(255,255,255,0.05)",
  "rgba(255, 255, 255, 0.1)",
  "rgba(255, 255, 255, 0.2)",
  "#ffffff",
  "#b0b0b0",
  "#9ca3af",
  "#52525b",
  "#71717a",
  "#374151",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "0.5rem",
  "0.375rem",
  "0 4px 6px rgba(0, 0, 0, 0.1)",
  "lift",
]);

export function withMapsDefaults<T extends object>(
  theme?: T | null,
): T & typeof MAPS_THEME_DEFAULTS {
  if (theme == null || typeof theme !== "object" || Array.isArray(theme)) {
    return { ...MAPS_THEME_DEFAULTS } as T & typeof MAPS_THEME_DEFAULTS;
  }
  const incoming = { ...(theme as Record<string, unknown>) };
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string" && STALE.has(value.toLowerCase())) {
      delete incoming[key];
    }
  }
  if (incoming.cardBorderRadius === "0.5rem" || incoming.cardBorderRadius === "0.375rem") {
    delete incoming.cardBorderRadius;
  }
  if (incoming.buttonBorderRadius === "0.5rem" || incoming.buttonBorderRadius === "0.375rem") {
    delete incoming.buttonBorderRadius;
  }
  if (incoming.blurIntensity === 0.5) {
    delete incoming.blurIntensity;
  }
  return { ...MAPS_THEME_DEFAULTS, ...incoming } as T & typeof MAPS_THEME_DEFAULTS;
}

export type MapsTheme = typeof MAPS_THEME_DEFAULTS & Record<string, unknown>;
