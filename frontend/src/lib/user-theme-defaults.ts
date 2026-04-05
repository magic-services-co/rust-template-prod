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

const cardBg = "rgba(14, 16, 20, 0.85)";
const cardBorder = "rgba(255, 255, 255, 0.1)";
const cardShadow = "0 4px 6px rgba(0, 0, 0, 0.2)";

const accentInteractive = "hsl(240, 4%, 46%)";
const accentInteractiveHover = "hsl(240, 4%, 56%)";
const accentLink = "hsl(240, 5%, 72%)";
const accentOnAccentFg = DS.foreground;

export const USER_THEME_DEFAULTS = {
  primaryTitleColor: DS.foreground,
  secondaryTextColor: DS.mutedForeground,
  backgroundColor: "transparent",
  pageBackground: "transparent",
  blurIntensity: undefined as number | undefined,

  headerCardBackground: cardBg,
  headerCardBorder: cardBorder,
  contentCardBackground: cardBg,
  contentCardBorder: cardBorder,
  cardBorderRadius: "0.5rem",
  cardPadding: "1.5rem",
  cardShadow,

  tabsBackground: cardBg,
  tabsBorder: cardBorder,
  tabActiveText: accentOnAccentFg,
  tabActiveBackground: accentInteractive,
  tabInactiveText: DS.mutedForeground,
  tabInactiveBackground: "transparent",

  buttonBorderRadius: "0.375rem",
  copyButtonBackground: "transparent",
  copyButtonText: DS.mutedForeground,
  buttonSuccessBackground: "hsl(142, 71%, 45%)",
  buttonSuccessText: DS.foreground,
  buttonDestructiveBackground: "hsl(0, 72%, 51%)",
  buttonDestructiveText: DS.foreground,
  buttonPrimaryBackground: accentInteractive,
  buttonPrimaryText: DS.foreground,
  buttonSecondaryBackground: "transparent",
  buttonSecondaryText: DS.mutedForeground,
  buttonSecondaryBorder: DS.border,

  userNameColor: DS.foreground,
  userIdColor: DS.mutedForeground,
  linkColor: accentLink,
  avatarBorderColor: "rgba(255, 255, 255, 0.2)",
  roleBadgeBackground: "rgba(255, 255, 255, 0.1)",
  roleBadgeBorder: "rgba(255, 255, 255, 0.2)",
  roleBadgeText: DS.foreground,
  contentCardTitleColor: DS.foreground,
  contentCardDescriptionColor: DS.mutedForeground,
  connectedAccountIconColor: DS.foreground,
  connectedAccountStageColor: DS.mutedForeground,

  titleColor: DS.foreground,
  subtitleColor: DS.mutedForeground,
  layoutPreset: "default",
  sidebarBackground: cardBg,
  sidebarBorder: cardBorder,
  sidebarTitleColor: DS.foreground,

  spacing: "1rem",

  // Bans page (same design system)
  cardBackground: cardBg,
  cardBorder,
  textPrimaryColor: DS.foreground,
  textSecondaryColor: DS.mutedForeground,
  textMutedColor: DS.mutedForeground,
  titleTextColor: DS.foreground,
  titleBackgroundColor: "transparent",
  titleBorderColor: cardBorder,
  titleBorderRadius: "0.5rem",
  buttonPrimaryHover: accentInteractiveHover,
  inputBackground: cardBg,
  inputBorder: cardBorder,
  inputTextColor: DS.foreground,
  inputPlaceholderColor: DS.mutedForeground,
  inputBorderRadius: "0.375rem",
  searchBackground: cardBg,
  searchBorder: cardBorder,
  searchBorderRadius: "0.375rem",

  profileFilterBackground:
    "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)",
  profileFilterBorder: "rgba(255, 255, 255, 0.28)",
  profileFilterTextColor: DS.foreground,
  profileFilterPlaceholderColor: "rgba(215, 220, 230, 0.55)",
  profileDropdownBackground: "hsl(222, 18%, 9%)",
  profileDropdownBorder: "rgba(255, 255, 255, 0.22)",
  profileDropdownTextColor: DS.foreground,
  profileDropdownItemHoverBackground: "rgba(255, 255, 255, 0.12)",
  profileDropdownChevronColor: DS.mutedForeground,
} as const;

export function withUserDefaults<T extends object>(
  serverTheme: T | undefined | null,
): T & typeof USER_THEME_DEFAULTS {
  if (serverTheme == null || typeof serverTheme !== "object" || Array.isArray(serverTheme)) {
    return { ...USER_THEME_DEFAULTS } as T & typeof USER_THEME_DEFAULTS;
  }
  return { ...USER_THEME_DEFAULTS, ...serverTheme } as T & typeof USER_THEME_DEFAULTS;
}

export function getUserThemeDefault<K extends keyof typeof USER_THEME_DEFAULTS>(
  key: K,
): (typeof USER_THEME_DEFAULTS)[K] {
  return USER_THEME_DEFAULTS[key];
}
