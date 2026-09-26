const cardBorder = "rgba(165,177,187,0.17)";

export const SERVERS_THEME_DEFAULTS = {
  kickerLabel: "PREMIUM RUST",
  pageTitle: "OUR SERVERS",
  pageSubtitle: "",
  kickerColor: "#ba9142",
  titleColor: "#f2f7ff",
  subtitleColor: "#9facc0",
  backgroundColor: "transparent",
  categoryTitleColor: "#eef4fb",
  categoryTitleSize: "28px",
  playerCountTextColor: "#c59a48",
  statusOnlineColor: "#60c781",
  statusOfflineColor: "#e8a0a3",
  wipeTextColor: "#a5b1bb",
  progressBarBackground: "#26313a",
  progressBarForeground: "#e2b84f",
  progressBarTextColor: "#eef4fb",
  cardBackground: "rgba(9, 13, 16, 0.94)",
  cardBorder,
  cardBorderRadius: "0px",
  cardShadow: "none",
  cardHoverEffect: "",
  cardPadding: "17px",
  spacing: "12px",
  buttonPrimaryBg: "transparent",
  buttonPrimaryText: "#d6a850",
  buttonPrimaryHoverBg: "rgba(214, 168, 80, 0.12)",
  buttonSecondaryBg: "transparent",
  buttonSecondaryText: "#a5b1bb",
  buttonSecondaryBorder: "transparent",
  buttonSecondaryHoverBg: "rgba(255,255,255,0.04)",
  buttonBorderRadius: "0px",
  includeLabel: "ALL SERVERS INCLUDE",
  includeText: "Active Admins · Enhanced Anti-Cheat · Balanced Rates · Fast Support",
} as const;

const STALE = new Set([
  "hsl(var(--background))",
  "rgba(15,20,25,0.1)",
  "rgba(14, 16, 20, 0.85)",
  "rgba(14, 16, 20, 0.92)",
  "#ffffff",
  "#b0b0b0",
  "#9ca3af",
  "#52525b",
  "#71717a",
  "#374151",
  "#ef4444",
  "#22c55e",
  "0.75rem",
  "0.5rem",
  "0.375rem",
  "0 4px 6px rgba(0, 0, 0, 0.3)",
  "0 8px 30px rgba(0, 0, 0, 0.35)",
  "scale",
  "lift",
]);

export function withServersDefaults<T extends object>(
  theme?: T | null,
): T & typeof SERVERS_THEME_DEFAULTS {
  if (theme == null || typeof theme !== "object" || Array.isArray(theme)) {
    return { ...SERVERS_THEME_DEFAULTS } as T & typeof SERVERS_THEME_DEFAULTS;
  }
  const incoming = { ...(theme as Record<string, unknown>) };
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string" && STALE.has(value.toLowerCase())) {
      delete incoming[key];
    }
  }
  if (incoming.cardBorderRadius === "0.75rem" || incoming.cardBorderRadius === "0.5rem") {
    delete incoming.cardBorderRadius;
  }
  if (incoming.buttonBorderRadius === "0.5rem" || incoming.buttonBorderRadius === "0.375rem") {
    delete incoming.buttonBorderRadius;
  }
  return { ...SERVERS_THEME_DEFAULTS, ...incoming } as T & typeof SERVERS_THEME_DEFAULTS;
}

export type ServersTheme = typeof SERVERS_THEME_DEFAULTS & Record<string, unknown>;
