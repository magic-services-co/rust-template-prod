export type ThemeEditorPageOption = {
  slug: string;
  label: string;
  path: string;
  group?: string;
};

export const THEME_EDITOR_CHROME_PAGES: ThemeEditorPageOption[] = [
  { slug: "nav", label: "Navigation", path: "site-wide", group: "Chrome" },
  { slug: "account", label: "Profile dropdown", path: "site-wide", group: "Chrome" },
  { slug: "footer", label: "Footer", path: "site-wide", group: "Chrome" },
];

export function isChromeEditorPage(page: ThemeEditorPageOption | undefined): boolean {
  return page?.path === "site-wide";
}

export const THEME_EDITOR_CORE_PAGES: ThemeEditorPageOption[] = [
  { slug: "home", label: "Home", path: "/", group: "Site" },
  { slug: "leaderboard", label: "Leaderboard", path: "/leaderboard", group: "Site" },
  { slug: "servers", label: "Servers", path: "/servers", group: "Site" },
  { slug: "maps", label: "Maps", path: "/maps", group: "Site" },
  { slug: "bans", label: "Bans", path: "/bans", group: "Site" },
  { slug: "store", label: "Store", path: "/store", group: "Site" },
  { slug: "support", label: "Support", path: "/support", group: "Site" },
  { slug: "profile", label: "Profile", path: "/profile", group: "Site" },
  { slug: "link", label: "Link", path: "/link", group: "Site" },
  { slug: "404", label: "404", path: "/404", group: "Site" },
  { slug: "403", label: "403", path: "/403", group: "Site" },
  { slug: "privacy-policy", label: "Privacy Policy", path: "/privacy-policy", group: "Site" },
  { slug: "terms-of-service", label: "Terms of Service", path: "/terms-of-service", group: "Site" },
];

type ServerPageRecord = {
  id?: string;
  slug?: string;
  title?: string;
  enabled?: boolean;
  server_id?: string | null;
  server?: { server_id?: string; server_name?: string } | null;
};

export function mapCustomServerPages(pages: unknown): ThemeEditorPageOption[] {
  if (!Array.isArray(pages)) return [];
  return (pages as ServerPageRecord[])
    .filter((page) => page && page.enabled !== false && typeof page.slug === "string" && page.slug.length > 0)
    .map((page) => {
      const serverId = page.server_id || page.server?.server_id || "";
      const serverName = page.server?.server_name?.trim() || "";
      const path = serverId ? `/servers/${serverId}/${page.slug}` : `/${page.slug}`;
      const slug = serverId ? `custom:${serverId}:${page.slug}` : `custom:${page.slug}`;
      const title = (page.title || page.slug || "Custom page").trim();
      return {
        slug,
        label: serverName ? `${title} · ${serverName}` : title,
        path,
        group: "Custom pages",
      };
    });
}

export function mergeThemeEditorPages(custom: ThemeEditorPageOption[]): ThemeEditorPageOption[] {
  const corePaths = new Set(THEME_EDITOR_CORE_PAGES.map((page) => page.path));
  const extra = custom.filter((page) => !corePaths.has(page.path));
  return [...THEME_EDITOR_CORE_PAGES, ...extra];
}

export function matchThemeEditorPage(
  pathname: string,
  pages: ThemeEditorPageOption[],
): ThemeEditorPageOption | undefined {
  const exact = pages.find((page) => page.path === pathname);
  if (exact) return exact;
  return pages
    .filter((page) => page.path !== "/" && (pathname === page.path || pathname.startsWith(`${page.path}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

export function withThemeEditorQuery(path: string): string {
  const [withoutHash, hash] = path.split("#");
  const joiner = withoutHash.includes("?") ? "&" : "?";
  return `${withoutHash}${joiner}theme-editor=true${hash ? `#${hash}` : ""}`;
}
