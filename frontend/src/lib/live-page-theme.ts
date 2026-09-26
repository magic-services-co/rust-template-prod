import { STORE_THEME_DEFAULTS, SUPPORT_THEME_DEFAULTS, LEGAL_THEME_DEFAULTS, PRIVACY_THEME_DEFAULTS } from "@/lib/layout-theme-defaults";
import { LEADERBOARD_THEME_DEFAULTS } from "@/lib/leaderboard-theme-defaults";
import { SERVERS_THEME_DEFAULTS } from "@/lib/servers-theme-defaults";
import { MAPS_THEME_DEFAULTS } from "@/lib/maps-theme-defaults";
import { BANS_THEME_DEFAULTS } from "@/lib/bans-theme-defaults";
import { USER_THEME_DEFAULTS } from "@/lib/user-theme-defaults";

export type LiveThemeFieldType = "text" | "textarea" | "color" | "toggle" | "url" | "number";

export type LiveThemeField = {
  key: string;
  label: string;
  hint?: string;
  group: string;
  type: LiveThemeFieldType;
};

export type LiveThemeGroup = { id: string; label: string; description: string };

export const CMS_THEME_DEFAULTS = {
  kickerColor: "#ba9142",
  titleColor: "#f2f7ff",
  accentColor: "#ba9142",
  subtitleColor: "#9facc0",
  cardBackground: "rgba(8, 12, 17, 0.94)",
  cardBorder: "rgba(255, 255, 255, 0.1)",
  cornerColor: "#ba9142",
  showCorners: true,
  headingColor: "#edf5ff",
  bodyColor: "#9facc0",
  linkColor: "#d7b15a",
  codeColor: "#f0c970",
} as const;

export const LINK_THEME_DEFAULTS = {
  kickerLabel: "FREE REWARDS",
  pageTitle: "LINK YOUR ACCOUNTS",
  pageSubtitle: "Get rewards in minutes by linking your accounts here and joining our Discord server.",
  kickerColor: "#ba9142",
  titleColor: "#f2f7ff",
  subtitleColor: "#9facc0",
} as const;

export type LivePageCatalog = {
  slug: string;
  label: string;
  settingsKey: string;
  fetchSlug: string;
  defaults: Record<string, unknown>;
};

const CATALOG: Record<string, LivePageCatalog> = {
  store: { slug: "store", label: "Store", settingsKey: "store", fetchSlug: "store", defaults: { ...STORE_THEME_DEFAULTS } },
  support: { slug: "support", label: "Support", settingsKey: "support", fetchSlug: "support", defaults: { ...SUPPORT_THEME_DEFAULTS } },
  ticket: { slug: "ticket", label: "Ticket", settingsKey: "support", fetchSlug: "support", defaults: { ...SUPPORT_THEME_DEFAULTS } },
  leaderboard: {
    slug: "leaderboard",
    label: "Leaderboard",
    settingsKey: "leaderboard",
    fetchSlug: "leaderboard",
    defaults: { ...LEADERBOARD_THEME_DEFAULTS },
  },
  servers: { slug: "servers", label: "Servers", settingsKey: "servers", fetchSlug: "servers", defaults: { ...SERVERS_THEME_DEFAULTS } },
  maps: { slug: "maps", label: "Maps", settingsKey: "maps", fetchSlug: "maps", defaults: { ...MAPS_THEME_DEFAULTS } },
  profile: { slug: "profile", label: "Profile", settingsKey: "profile", fetchSlug: "profile", defaults: { ...USER_THEME_DEFAULTS } },
  bans: { slug: "bans", label: "Bans", settingsKey: "bans", fetchSlug: "bans", defaults: { ...BANS_THEME_DEFAULTS } },
  link: { slug: "link", label: "Link", settingsKey: "link", fetchSlug: "link", defaults: { ...LINK_THEME_DEFAULTS } },
  "privacy-policy": {
    slug: "privacy-policy",
    label: "Privacy Policy",
    settingsKey: "privacy",
    fetchSlug: "privacy-policy",
    defaults: { ...PRIVACY_THEME_DEFAULTS },
  },
  "terms-of-service": {
    slug: "terms-of-service",
    label: "Terms of Service",
    settingsKey: "legal",
    fetchSlug: "terms-of-service",
    defaults: { ...LEGAL_THEME_DEFAULTS },
  },
  cms: { slug: "cms", label: "Custom pages", settingsKey: "cms", fetchSlug: "cms", defaults: { ...CMS_THEME_DEFAULTS } },
};

const SKIP_KEYS = new Set(["layoutPreset", "cardHoverEffect"]);

export function resolveLivePageSlug(pathname: string, pageSlug: string): string {
  if (pageSlug === "home") return "home";
  if (pageSlug.startsWith("custom:")) return "cms";
  if (CATALOG[pageSlug]) return pageSlug;
  if (pathname.startsWith("/ticket")) return "ticket";
  if (pathname.startsWith("/support")) return "support";
  if (pathname.startsWith("/store")) return "store";
  if (pathname.startsWith("/maps")) return "maps";
  if (pathname.startsWith("/servers/") && pathname.split("/").filter(Boolean).length >= 3) return "cms";
  if (!CATALOG[pageSlug] && pageSlug !== "404" && pageSlug !== "403" && pageSlug !== "admin") {
    return "cms";
  }
  return pageSlug;
}

export function getLivePageCatalog(slug: string): LivePageCatalog | null {
  return CATALOG[slug] ?? null;
}

export const LIVE_THEME_GROUPS: LiveThemeGroup[] = [
  { id: "hero", label: "Hero", description: "Kicker, titles, and intro copy." },
  { id: "cards", label: "Cards & tables", description: "Fills, borders, tabs, and list chrome." },
  { id: "buttons", label: "Buttons", description: "Primary and secondary actions." },
  { id: "forms", label: "Inputs", description: "Search, fields, and labels." },
  { id: "look", label: "Look", description: "Everything else on this page." },
];

function humanize(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function groupForKey(key: string): string {
  const k = key.toLowerCase();
  if (/kicker|pagetitle|pagesubtitle|herotitle|intro|lastupdated/.test(k) && !/color|background|border/.test(k)) {
    return "hero";
  }
  if (/^(title|subtitle|pagetitle|kicker)/.test(k) && /color|accent/.test(k)) return "hero";
  if (/^(page)?title$|^(page)?subtitle$|^kickerlabel$|^kickercolor$|^titlecolor$|^subtitlecolor$|^titleaccent/.test(k)) {
    return "hero";
  }
  if (/button|cta|helpc/.test(k)) return "buttons";
  if (/input|form|search|placeholder|labelcolor/.test(k)) return "forms";
  if (/card|tab|badge|table|product|category|mapcard|rank|progress|status/.test(k)) return "cards";
  return "look";
}

function looksLikeColor(key: string, value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (/^(#|rgba?\(|hsla?\(|transparent|currentcolor)/i.test(v)) return true;
  if (/radius|width|size|padding|spacing|shadow|preset|effect|label|title|subtitle|note|text$|href|url/i.test(key)) {
    return false;
  }
  return /color|background|border|bg$/i.test(key) && v.length < 80;
}

export function fieldsFromDefaults(defaults: Record<string, unknown>): LiveThemeField[] {
  return Object.entries(defaults)
    .filter(([key, value]) => !SKIP_KEYS.has(key) && value !== undefined)
    .map(([key, value]) => {
      let type: LiveThemeFieldType = "text";
      if (typeof value === "boolean") type = "toggle";
      else if (typeof value === "number") type = "number";
      else if (looksLikeColor(key, value)) type = "color";
      else if (typeof value === "string" && (value.length > 88 || value.includes("\n"))) type = "textarea";
      else if (/href|url$/i.test(key)) type = "url";
      return {
        key,
        label: humanize(key),
        group: groupForKey(key),
        type,
      };
    });
}

export function fieldByKey(fields: LiveThemeField[], key: string): LiveThemeField | undefined {
  return fields.find((field) => field.key === key);
}

export function mergeThemeDefaults(
  defaults: Record<string, unknown>,
  incoming?: Record<string, unknown> | null,
): Record<string, unknown> {
  const next = { ...defaults };
  if (!incoming || typeof incoming !== "object") return next;
  for (const key of Object.keys(defaults)) {
    const value = incoming[key];
    if (value === undefined || value === null) continue;
    const fallback = defaults[key];
    if (typeof fallback === "boolean") next[key] = Boolean(value);
    else if (typeof fallback === "number") {
      const n = typeof value === "number" ? value : Number(value);
      next[key] = Number.isFinite(n) ? n : fallback;
    } else {
      next[key] = String(value);
    }
  }
  return next;
}
