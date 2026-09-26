const cardBg = "rgba(8, 12, 17, 0.94)";
const cardBorder = "rgba(255, 255, 255, 0.1)";

export const BANS_THEME_DEFAULTS = {
  kickerLabel: "COMMUNITY / BANS",
  pageTitle: "BAN LIST",
  pageSubtitle: "Active and past bans across the community.",
  kickerColor: "#ba9142",
  titleColor: "#f2f7ff",
  subtitleColor: "#9facc0",
  backgroundColor: "transparent",
  cardBackground: cardBg,
  cardBorder,
  cardBorderRadius: "0px",
  cardShadow: "none",
  buttonPrimaryBackground: "transparent",
  buttonPrimaryText: "#f0c970",
  buttonPrimaryHoverBackground: "rgba(186, 145, 66, 0.12)",
  buttonSecondaryBackground: "transparent",
  buttonSecondaryText: "#c5d0de",
  buttonSecondaryBorder: cardBorder,
  buttonSecondaryHoverBackground: "rgba(255, 255, 255, 0.04)",
  buttonBorderRadius: "0px",
  badgeActiveBackground: "rgba(232, 160, 163, 0.16)",
  badgeActiveText: "#e8a0a3",
  badgeInactiveBackground: "transparent",
  badgeInactiveText: "#93a4b8",
  badgeGlobalBackground: "rgba(232, 160, 163, 0.16)",
  badgeGlobalText: "#e8a0a3",
  badgeCategoryBackground: "rgba(186, 145, 66, 0.12)",
  badgeCategoryText: "#f0c970",
  badgeIndividualBackground: "rgba(186, 145, 66, 0.12)",
  badgeIndividualText: "#d7b15a",
  textPrimaryColor: "#f2f7ff",
  textSecondaryColor: "#8292a6",
  textMutedColor: "#8292a6",
  inputBackground: "#070a0e",
  inputBorder: cardBorder,
  inputTextColor: "#eef4fb",
  inputPlaceholderColor: "#708195",
  inputBorderRadius: "0px",
  searchBackground: "#070a0e",
  searchBorder: cardBorder,
  searchBorderRadius: "0px",
  spacing: "16px",
  cardPadding: "28px",
  cardHoverEffect: "",
} as const;

const STALE_BANS_VALUES = new Set([
  "hsl(var(--background))",
  "hsl(var(--foreground))",
  "hsl(var(--card))",
  "hsl(var(--border))",
  "hsl(var(--muted-foreground))",
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
  "#6b7280",
  "#dc2626",
  "#ea580c",
  "#7c3aed",
  "0.75rem",
  "0.5rem",
  "0.375rem",
  "0 4px 6px rgba(0, 0, 0, 0.3)",
  "0 4px 6px rgba(0, 0, 0, 0.1)",
]);

export function withBansDefaults<T extends object>(
  theme?: T | null,
): T & typeof BANS_THEME_DEFAULTS {
  if (theme == null || typeof theme !== "object" || Array.isArray(theme)) {
    return { ...BANS_THEME_DEFAULTS } as T & typeof BANS_THEME_DEFAULTS;
  }
  const incoming = { ...(theme as Record<string, unknown>) };
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string" && STALE_BANS_VALUES.has(value.toLowerCase())) {
      delete incoming[key];
    }
  }
  if (incoming.cardBorderRadius === "0.75rem" || incoming.cardBorderRadius === "0.5rem" || incoming.cardBorderRadius === "0.375rem") {
    delete incoming.cardBorderRadius;
  }
  if (incoming.buttonBorderRadius === "0.5rem" || incoming.buttonBorderRadius === "0.375rem") {
    delete incoming.buttonBorderRadius;
  }
  return { ...BANS_THEME_DEFAULTS, ...incoming } as T & typeof BANS_THEME_DEFAULTS;
}

export type BansTheme = typeof BANS_THEME_DEFAULTS & Record<string, unknown>;
