export const HOME_THEME_DEFAULTS = {
  showJoinCommunity: true,
  showServers: true,
  showServerRules: true,
  showTeam: false,
  showHeroPrimaryCta: true,
  showHeroSecondaryCta: true,
  showCommunityCta: true,
  showDiscordCount: true,
  showServersCta: true,
  useSiteNameAsAccent: true,

  kickerLabel: "PREMIUM RUST",
  pageTitle: "WELCOME TO",
  pageTitleAccent: "",
  pageSubtitle:
    "Join our thriving community and experience the ultimate survival gameplay on our high-performance Rust servers.",
  heroPrimaryLabel: "VISIT STORE",
  heroPrimaryHref: "/store",
  heroSecondaryLabel: "JOIN DISCORD",
  heroSecondaryHref: "",

  communityKicker: "DISCORD",
  communityTitle: "JOIN THE",
  communityTitleAccent: "COMMUNITY",
  communitySubtitle: "Discuss server decisions, get wipe pings, and talk to staff — all on Discord.",
  communityCtaLabel: "JOIN DISCORD",
  communityCtaHref: "",
  discordCountSuffix: "DISCORD MEMBERS",
  avatarEmptyLabel: "Link Your Account",
  communitySlots: 24,

  serversKicker: "PREMIUM RUST",
  serversTitle: "OUR",
  serversTitleAccent: "SERVERS",
  serversSubtitle: "High-performance Rust servers with active communities and regular wipes.",
  serversCtaLabel: "VIEW ALL SERVERS",
  serversCtaHref: "/servers",
  serversShowCorners: true,
  serversCardBackground: "rgba(8, 12, 17, 0.94)",
  serversCardBorder: "rgba(165, 177, 187, 0.17)",
  serversCardHover: "rgba(16, 22, 30, 0.98)",
  serversCornerColor: "#ba9142",
  serversNameColor: "#eef4fb",
  serversMetaColor: "#a5b1bb",
  serversCountColor: "#eef4fb",
  serversConnectColor: "#d6a850",
  serversDivider: "rgba(160, 183, 202, 0.1)",
  serversBarTrack: "#26313a",
  serversBarFrom: "#aa8137",
  serversBarTo: "#e2b84f",
  serversColumns: 3,
  serversCardRadius: 0,
  serversCardPad: 17,
  serversCardGap: 16,
  serversLimit: 6,

  rulesKicker: "FAIR PLAY",
  rulesTitle: "SERVER",
  rulesTitleAccent: "RULES",
  rulesSubtitle:
    'We take these rules seriously. Staff may remove access for violations — there are no "loop holes".',
  emptyRulesTitle: "No Rules Configured",
  emptyRulesBody: "Please configure the server rules in the admin panel.",
  rulesShowCorners: true,
  rulesCardBackground: "rgba(8, 12, 17, 0.94)",
  rulesCardBorder: "rgba(255, 255, 255, 0.1)",
  rulesCornerColor: "#ba9142",
  rulesHoverBackground: "rgba(255, 255, 255, 0.03)",
  rulesTriggerColor: "#edf5ff",
  rulesBodyColor: "#9facc0",
  rulesRadius: 0,

  teamKicker: "STAFF",
  teamTitle: "OUR",
  teamTitleAccent: "TEAM",
  teamSubtitle: "The people keeping wipes fair, servers online, and tickets answered.",
  emptyTeamText: "No team members configured yet.",
  teamShowCorners: true,
  teamCardBackground: "rgba(8, 12, 17, 0.94)",
  teamCardBorder: "rgba(255, 255, 255, 0.1)",
  teamCardHover: "rgba(16, 22, 30, 0.98)",
  teamCornerColor: "#ba9142",
  teamNameColor: "#edf5ff",
  teamFallbackRoleColor: "#ba9142",
  teamAvatarBorder: "rgba(161, 191, 218, 0.3)",
  teamAvatarEmpty: "#8292a6",
  teamColumns: 3,
  teamAvatarSize: 72,
  teamAvatarRadius: 0,
  teamCardRadius: 0,
  teamCardPad: 24,
  teamCardGap: 12,

  kickerColor: "#ba9142",
  titleColor: "#f2f7ff",
  titleAccentColor: "#ba9142",
  subtitleColor: "#9facc0",
  cardBackground: "rgba(8, 12, 17, 0.94)",
  cardBorder: "rgba(255, 255, 255, 0.1)",
  triggerTextColor: "#edf5ff",
  contentTextColor: "#9facc0",
  primaryButtonBg: "#0a0e13",
  primaryButtonBorder: "#ba9142",
  primaryButtonText: "#ecf3fc",
  secondaryButtonBg: "transparent",
  secondaryButtonBorder: "rgba(255, 255, 255, 0.1)",
  secondaryButtonText: "#c5d0de",
  avatarSlotFrom: "rgb(48, 65, 80)",
  avatarSlotTo: "rgb(17, 25, 33)",
  avatarSlotBorder: "rgba(161, 191, 218, 0.28)",
  memberCountColor: "#ba9142",
} as const;

export type HomeTheme = {
  [K in keyof typeof HOME_THEME_DEFAULTS]: (typeof HOME_THEME_DEFAULTS)[K] extends boolean
    ? boolean
    : (typeof HOME_THEME_DEFAULTS)[K] extends number
      ? number
      : string;
};

export type HomeThemeGroupId =
  | "visibility"
  | "hero"
  | "community"
  | "servers"
  | "rules"
  | "team"
  | "look";

export type HomeThemeFieldType = "text" | "textarea" | "color" | "toggle" | "url" | "number";

export type HomeThemeField = {
  key: keyof HomeTheme;
  label: string;
  hint?: string;
  group: HomeThemeGroupId;
  type: HomeThemeFieldType;
};

export const HOME_THEME_GROUPS: { id: HomeThemeGroupId; label: string; description: string }[] = [
  { id: "visibility", label: "Sections", description: "Turn whole blocks on or off." },
  { id: "hero", label: "Hero", description: "Welcome title, subtitle, and top buttons." },
  { id: "community", label: "Community", description: "Discord block and avatar grid." },
  { id: "servers", label: "Server cards", description: "Server cards: fill, corners, type, bar, columns." },
  { id: "rules", label: "Rules card", description: "Accordion card: copy, fill, border, corners, hover." },
  { id: "team", label: "Team cards", description: "Staff cards: fill, corners, avatar, columns, hover." },
  { id: "look", label: "Buttons & type", description: "Shared gold, titles, and button colors." },
];

export const HOME_THEME_FIELDS: HomeThemeField[] = [
  { key: "showJoinCommunity", label: "Show community", group: "visibility", type: "toggle" },
  { key: "showServers", label: "Show servers", group: "visibility", type: "toggle" },
  { key: "showServerRules", label: "Show rules", group: "visibility", type: "toggle" },
  { key: "showTeam", label: "Show team", group: "visibility", type: "toggle" },
  { key: "showHeroPrimaryCta", label: "Show Visit Store button", group: "visibility", type: "toggle" },
  { key: "showHeroSecondaryCta", label: "Show hero Discord button", group: "visibility", type: "toggle" },
  { key: "showCommunityCta", label: "Show community Discord button", group: "visibility", type: "toggle" },
  { key: "showDiscordCount", label: "Show Discord member count", group: "visibility", type: "toggle" },
  { key: "showServersCta", label: "Show View all servers", group: "visibility", type: "toggle" },

  { key: "kickerLabel", label: "Hero kicker", hint: "Small gold label above the title", group: "hero", type: "text" },
  { key: "pageTitle", label: "Hero title", group: "hero", type: "text" },
  {
    key: "useSiteNameAsAccent",
    label: "Use site name as gold title",
    hint: "Turn off to type your own gold words",
    group: "hero",
    type: "toggle",
  },
  { key: "pageTitleAccent", label: "Hero gold words", hint: "Used when site name is off", group: "hero", type: "text" },
  { key: "pageSubtitle", label: "Hero subtitle", group: "hero", type: "textarea" },
  { key: "heroPrimaryLabel", label: "Primary button text", group: "hero", type: "text" },
  { key: "heroPrimaryHref", label: "Primary button link", group: "hero", type: "url" },
  { key: "heroSecondaryLabel", label: "Secondary button text", group: "hero", type: "text" },
  {
    key: "heroSecondaryHref",
    label: "Secondary button link",
    hint: "Leave blank to use the site Discord invite",
    group: "hero",
    type: "url",
  },

  { key: "communityKicker", label: "Community kicker", group: "community", type: "text" },
  { key: "communityTitle", label: "Community title", group: "community", type: "text" },
  { key: "communityTitleAccent", label: "Community gold words", group: "community", type: "text" },
  { key: "communitySubtitle", label: "Community subtitle", group: "community", type: "textarea" },
  { key: "communityCtaLabel", label: "Community button text", group: "community", type: "text" },
  {
    key: "communityCtaHref",
    label: "Community button link",
    hint: "Leave blank to use the site Discord invite",
    group: "community",
    type: "url",
  },
  { key: "discordCountSuffix", label: "Member count label", group: "community", type: "text" },
  { key: "avatarEmptyLabel", label: "Empty avatar tooltip", group: "community", type: "text" },
  { key: "communitySlots", label: "Avatar slots", hint: "6–48", group: "community", type: "number" },
  { key: "avatarSlotFrom", label: "Avatar gradient start", group: "community", type: "color" },
  { key: "avatarSlotTo", label: "Avatar gradient end", group: "community", type: "color" },
  { key: "avatarSlotBorder", label: "Avatar border", group: "community", type: "color" },
  { key: "memberCountColor", label: "Member count", group: "community", type: "color" },

  { key: "serversKicker", label: "Servers kicker", group: "servers", type: "text" },
  { key: "serversTitle", label: "Servers title", group: "servers", type: "text" },
  { key: "serversTitleAccent", label: "Servers gold words", group: "servers", type: "text" },
  { key: "serversSubtitle", label: "Servers subtitle", group: "servers", type: "textarea" },
  { key: "serversCtaLabel", label: "View all button text", group: "servers", type: "text" },
  { key: "serversCtaHref", label: "View all button link", group: "servers", type: "url" },
  { key: "serversShowCorners", label: "Gold corners", group: "servers", type: "toggle" },
  { key: "serversCardBackground", label: "Card fill", group: "servers", type: "color" },
  { key: "serversCardBorder", label: "Card border", group: "servers", type: "color" },
  { key: "serversCardHover", label: "Card hover", group: "servers", type: "color" },
  { key: "serversCornerColor", label: "Corner color", group: "servers", type: "color" },
  { key: "serversNameColor", label: "Server name", group: "servers", type: "color" },
  { key: "serversMetaColor", label: "Meta text", hint: "Region, wipe, map vote", group: "servers", type: "color" },
  { key: "serversCountColor", label: "Player count", group: "servers", type: "color" },
  { key: "serversConnectColor", label: "Connect link", group: "servers", type: "color" },
  { key: "serversDivider", label: "Inner divider", group: "servers", type: "color" },
  { key: "serversBarTrack", label: "Population track", group: "servers", type: "color" },
  { key: "serversBarFrom", label: "Population bar start", group: "servers", type: "color" },
  { key: "serversBarTo", label: "Population bar end", group: "servers", type: "color" },
  { key: "serversColumns", label: "Cards per row", hint: "1–4", group: "servers", type: "number" },
  { key: "serversCardRadius", label: "Card radius", hint: "0–32 px", group: "servers", type: "number" },
  { key: "serversCardPad", label: "Card padding", hint: "8–40 px", group: "servers", type: "number" },
  { key: "serversCardGap", label: "Gap between cards", hint: "4–40 px", group: "servers", type: "number" },
  { key: "serversLimit", label: "Cards on home", hint: "1–12", group: "servers", type: "number" },

  { key: "rulesKicker", label: "Rules kicker", group: "rules", type: "text" },
  { key: "rulesTitle", label: "Rules title", group: "rules", type: "text" },
  { key: "rulesTitleAccent", label: "Rules gold words", group: "rules", type: "text" },
  { key: "rulesSubtitle", label: "Rules subtitle", group: "rules", type: "textarea" },
  { key: "emptyRulesTitle", label: "Empty rules title", group: "rules", type: "text" },
  { key: "emptyRulesBody", label: "Empty rules body", group: "rules", type: "textarea" },
  { key: "rulesShowCorners", label: "Gold corners", group: "rules", type: "toggle" },
  { key: "rulesCardBackground", label: "Card fill", group: "rules", type: "color" },
  { key: "rulesCardBorder", label: "Card border", group: "rules", type: "color" },
  { key: "rulesCornerColor", label: "Corner color", group: "rules", type: "color" },
  { key: "rulesHoverBackground", label: "Row hover", group: "rules", type: "color" },
  { key: "rulesTriggerColor", label: "Rule titles", group: "rules", type: "color" },
  { key: "rulesBodyColor", label: "Rule body", group: "rules", type: "color" },
  { key: "rulesRadius", label: "Corner radius", hint: "0–32 px", group: "rules", type: "number" },

  { key: "teamKicker", label: "Team kicker", group: "team", type: "text" },
  { key: "teamTitle", label: "Team title", group: "team", type: "text" },
  { key: "teamTitleAccent", label: "Team gold words", group: "team", type: "text" },
  { key: "teamSubtitle", label: "Team subtitle", group: "team", type: "textarea" },
  { key: "emptyTeamText", label: "Empty team text", group: "team", type: "text" },
  { key: "teamShowCorners", label: "Gold corners", group: "team", type: "toggle" },
  { key: "teamCardBackground", label: "Card fill", group: "team", type: "color" },
  { key: "teamCardBorder", label: "Card border", group: "team", type: "color" },
  { key: "teamCardHover", label: "Card hover", group: "team", type: "color" },
  { key: "teamCornerColor", label: "Corner color", group: "team", type: "color" },
  { key: "teamNameColor", label: "Name color", group: "team", type: "color" },
  { key: "teamFallbackRoleColor", label: "Role color fallback", group: "team", type: "color" },
  { key: "teamAvatarBorder", label: "Photo border", group: "team", type: "color" },
  { key: "teamAvatarEmpty", label: "Missing photo", group: "team", type: "color" },
  { key: "teamColumns", label: "Cards per row", hint: "2–4", group: "team", type: "number" },
  { key: "teamAvatarSize", label: "Photo size", hint: "40–128 px", group: "team", type: "number" },
  { key: "teamAvatarRadius", label: "Photo radius", hint: "0 = square", group: "team", type: "number" },
  { key: "teamCardRadius", label: "Card radius", hint: "0–32 px", group: "team", type: "number" },
  { key: "teamCardPad", label: "Card padding", hint: "8–48 px", group: "team", type: "number" },
  { key: "teamCardGap", label: "Gap between cards", hint: "4–40 px", group: "team", type: "number" },

  { key: "kickerColor", label: "Kicker", group: "look", type: "color" },
  { key: "titleColor", label: "Titles", group: "look", type: "color" },
  { key: "titleAccentColor", label: "Gold words", group: "look", type: "color" },
  { key: "subtitleColor", label: "Subtitles", group: "look", type: "color" },
  { key: "primaryButtonBg", label: "Primary button fill", group: "look", type: "color" },
  { key: "primaryButtonBorder", label: "Primary button border", group: "look", type: "color" },
  { key: "primaryButtonText", label: "Primary button text", group: "look", type: "color" },
  { key: "secondaryButtonBg", label: "Secondary button fill", group: "look", type: "color" },
  { key: "secondaryButtonBorder", label: "Secondary button border", group: "look", type: "color" },
  { key: "secondaryButtonText", label: "Secondary button text", group: "look", type: "color" },
];

const BOOLEAN_KEYS = new Set(
  HOME_THEME_FIELDS.filter((f) => f.type === "toggle").map((f) => f.key),
);
const NUMBER_KEYS = new Set(
  HOME_THEME_FIELDS.filter((f) => f.type === "number").map((f) => f.key),
);

const NUMBER_CLAMP: Partial<Record<keyof HomeTheme, [number, number]>> = {
  communitySlots: [6, 48],
  teamColumns: [2, 4],
  teamAvatarSize: [40, 128],
  teamAvatarRadius: [0, 64],
  teamCardRadius: [0, 32],
  teamCardPad: [8, 48],
  teamCardGap: [4, 40],
  rulesRadius: [0, 32],
  serversColumns: [1, 4],
  serversCardRadius: [0, 32],
  serversCardPad: [8, 40],
  serversCardGap: [4, 40],
  serversLimit: [1, 12],
};

function coerceValue(key: keyof HomeTheme, value: unknown): HomeTheme[keyof HomeTheme] {
  if (BOOLEAN_KEYS.has(key)) return Boolean(value) as HomeTheme[keyof HomeTheme];
  if (NUMBER_KEYS.has(key)) {
    const n = typeof value === "number" ? value : Number(value);
    const fallback = HOME_THEME_DEFAULTS[key];
    if (!Number.isFinite(n)) return fallback as HomeTheme[keyof HomeTheme];
    const clamp = NUMBER_CLAMP[key];
    const rounded = Math.round(n);
    if (!clamp) return rounded as HomeTheme[keyof HomeTheme];
    return Math.min(clamp[1], Math.max(clamp[0], rounded)) as HomeTheme[keyof HomeTheme];
  }
  if (value == null) return HOME_THEME_DEFAULTS[key];
  return String(value) as HomeTheme[keyof HomeTheme];
}

function withCardAliases(incoming: Record<string, unknown>): Record<string, unknown> {
  const next = { ...incoming };
  if (next.teamCardBackground == null && next.cardBackground != null) next.teamCardBackground = next.cardBackground;
  if (next.rulesCardBackground == null && next.cardBackground != null) next.rulesCardBackground = next.cardBackground;
  if (next.serversCardBackground == null && next.cardBackground != null) next.serversCardBackground = next.cardBackground;
  if (next.teamCardBorder == null && next.cardBorder != null) next.teamCardBorder = next.cardBorder;
  if (next.rulesCardBorder == null && next.cardBorder != null) next.rulesCardBorder = next.cardBorder;
  if (next.serversCardBorder == null && next.cardBorder != null) next.serversCardBorder = next.cardBorder;
  if (next.rulesTriggerColor == null && next.triggerTextColor != null) next.rulesTriggerColor = next.triggerTextColor;
  if (next.rulesBodyColor == null && next.contentTextColor != null) next.rulesBodyColor = next.contentTextColor;
  return next;
}

export function withHomeDefaults(theme?: Record<string, unknown> | null): HomeTheme {
  const incoming = withCardAliases(
    theme && typeof theme === "object" && !Array.isArray(theme) ? theme : {},
  );
  const next = { ...HOME_THEME_DEFAULTS } as HomeTheme;
  (Object.keys(HOME_THEME_DEFAULTS) as (keyof HomeTheme)[]).forEach((key) => {
    if (incoming[key] === undefined || incoming[key] === null) return;
    next[key] = coerceValue(key, incoming[key]) as never;
  });
  return next;
}

export function homeFieldByKey(key: string): HomeThemeField | undefined {
  return HOME_THEME_FIELDS.find((f) => f.key === key);
}

export function featuresFromHomeTheme(theme: HomeTheme) {
  return {
    showJoinCommunity: theme.showJoinCommunity,
    showServerRules: theme.showServerRules,
    showServers: theme.showServers,
    showTeam: theme.showTeam,
  };
}
