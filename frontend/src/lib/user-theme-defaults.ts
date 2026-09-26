const DS = {
  background: "hsl(223.64, 16.27%, 2.75%)",
  foreground: "hsl(210, 40%, 98%)",
  card: "hsl(230, 20%, 6%)",
  muted: "hsl(217.2, 32.6%, 17.5%)",
  mutedForeground: "hsl(215, 20.2%, 65.1%)",
  border: "hsl(217.2, 32.6%, 17.5%)",
  primary: "hsl(210, 40%, 98%)",
  destructive: "hsl(0, 62.8%, 30.6%)",
  destructiveForeground: "hsl(210, 40%, 98%)",
  secondary: "hsl(217.2, 32.6%, 17.5%)",
  ring: "hsl(212.7, 26.8%, 83.9%)",
  input: "hsl(217.2, 32.6%, 17.5%)",
} as const;

const cardBg = "rgba(8, 12, 17, 0.94)";
const cardBorder = "rgba(255, 255, 255, 0.1)";
const cardShadow = "none";

export const USER_THEME_DEFAULTS = {
  primaryTitleColor: "#f2f7ff",
  secondaryTextColor: "#8292a6",
  backgroundColor: "transparent",
  pageBackground: "transparent",
  blurIntensity: undefined as number | undefined,

  headerCardBackground: cardBg,
  headerCardBorder: cardBorder,
  contentCardBackground: cardBg,
  contentCardBorder: cardBorder,
  cardBorderRadius: "0px",
  cardPadding: "28px",
  cardShadow,

  tabsBackground: "#0a0e14",
  tabsBorder: cardBorder,
  tabActiveText: "#080a0e",
  tabActiveBackground: "#ba9142",
  tabInactiveText: "#93a4b8",
  tabInactiveBackground: "transparent",

  buttonBorderRadius: "0px",
  copyButtonBackground: "transparent",
  copyButtonText: "#8292a6",
  buttonSuccessBackground: "rgba(129, 216, 117, 0.16)",
  buttonSuccessText: "#81d875",
  buttonDestructiveBackground: "transparent",
  buttonDestructiveText: "#e8a0a3",
  buttonPrimaryBackground: "transparent",
  buttonPrimaryText: "#f0c970",
  buttonSecondaryBackground: "transparent",
  buttonSecondaryText: "#c5d0de",
  buttonSecondaryBorder: cardBorder,

  userNameColor: "#f2f7ff",
  userIdColor: "#8292a6",
  linkColor: "#d7b15a",
  avatarBorderColor: "rgba(255, 255, 255, 0.1)",
  roleBadgeBackground: "rgba(186, 145, 66, 0.12)",
  roleBadgeBorder: "rgba(186, 145, 66, 0.45)",
  roleBadgeText: "#f0c970",
  contentCardTitleColor: "#eef4fb",
  contentCardDescriptionColor: "#8292a6",
  connectedAccountIconColor: "#eef4fb",
  connectedAccountStageColor: "#8292a6",

  titleColor: "#f2f7ff",
  subtitleColor: "#9facc0",
  layoutPreset: "default",
  sidebarBackground: cardBg,
  sidebarBorder: cardBorder,
  sidebarTitleColor: "#eef4fb",

  spacing: "16px",

  cardBackground: cardBg,
  cardBorder,
  textPrimaryColor: "#f2f7ff",
  textSecondaryColor: "#8292a6",
  textMutedColor: "#8292a6",
  titleTextColor: "#f2f7ff",
  titleBackgroundColor: "transparent",
  titleBorderColor: cardBorder,
  titleBorderRadius: "0px",
  buttonPrimaryHover: "rgba(186, 145, 66, 0.12)",
  inputBackground: "#070a0e",
  inputBorder: cardBorder,
  inputTextColor: "#eef4fb",
  inputPlaceholderColor: "#708195",
  inputBorderRadius: "0px",
  searchBackground: "#070a0e",
  searchBorder: cardBorder,
  searchBorderRadius: "0px",

  profileFilterBackground: "#070a0e",
  profileFilterBorder: cardBorder,
  profileFilterTextColor: "#eef4fb",
  profileFilterPlaceholderColor: "#708195",
  profileDropdownBackground: "#0b0f15",
  profileDropdownBorder: cardBorder,
  profileDropdownTextColor: "#eef4fb",
  profileDropdownItemHoverBackground: "rgba(255, 255, 255, 0.04)",
  profileDropdownChevronColor: "#8292a6",
} as const;

const STALE_USER_VALUES = new Set([
  "hsl(var(--background))",
  "hsl(var(--foreground))",
  "hsl(var(--card))",
  "hsl(var(--border))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(var(--primary-foreground))",
  "hsl(var(--destructive))",
  "hsl(var(--destructive-foreground))",
  "hsl(var(--muted))",
  "hsl(var(--input))",
  "hsl(var(--ring))",
  "hsl(223.64, 16.27%, 2.75%)",
  "hsl(230, 20%, 6%)",
  "hsl(217.2, 32.6%, 17.5%)",
  "hsl(215, 20.2%, 65.1%)",
  "hsl(210, 40%, 98%)",
  "hsl(240, 4%, 46%)",
  "hsl(240, 5%, 72%)",
  "rgba(14, 16, 20, 0.85)",
  "#ffffff",
  "#b0b0b0",
  "#22c55e",
  "#9ca3af",
  "#52525b",
  "#71717a",
  "#374151",
  "#ef4444",
  "#101823",
  "#5865f2",
  "#e5e7eb",
  "#f59e0b",
  "rgba(15,20,25,0.1)",
  "rgba(255, 255, 255, 0.05)",
  "rgba(255,255,255,0.05)",
  "rgba(255, 255, 255, 0.2)",
  "0.5rem",
  "0.375rem",
  "0 4px 6px rgba(0, 0, 0, 0.2)",
  "0 4px 6px rgba(0, 0, 0, 0.1)",
  "0 1px 3px rgba(0,0,0,0.1)",
]);

export function withUserDefaults<T extends object>(
  serverTheme: T | undefined | null,
): T & typeof USER_THEME_DEFAULTS {
  if (serverTheme == null || typeof serverTheme !== "object" || Array.isArray(serverTheme)) {
    return { ...USER_THEME_DEFAULTS } as T & typeof USER_THEME_DEFAULTS;
  }
  const incoming = { ...(serverTheme as Record<string, unknown>) };
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string" && STALE_USER_VALUES.has(value.toLowerCase())) {
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
  return { ...USER_THEME_DEFAULTS, ...incoming } as T & typeof USER_THEME_DEFAULTS;
}

export function getUserThemeDefault<K extends keyof typeof USER_THEME_DEFAULTS>(
  key: K,
): (typeof USER_THEME_DEFAULTS)[K] {
  return USER_THEME_DEFAULTS[key];
}
