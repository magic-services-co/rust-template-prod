export function parsePageTheme(
  settings: unknown,
  pageSlug?: string
): Record<string, unknown> {
  const s = settings && typeof settings === "object" ? (settings as Record<string, unknown>) : null;
  if (!s) return {};

  if (pageSlug === "leaderboard" && typeof s.leaderboard === "object" && s.leaderboard !== null) {
    return s.leaderboard as Record<string, unknown>;
  }
  if (pageSlug === "maps" && typeof s.maps === "object" && s.maps !== null) {
    return s.maps as Record<string, unknown>;
  }
  if (pageSlug === "profile" && typeof s.profile === "object" && s.profile !== null) {
    return s.profile as Record<string, unknown>;
  }
  if (pageSlug === "support" && typeof s.support === "object" && s.support !== null) {
    return s.support as Record<string, unknown>;
  }
  if (pageSlug === "servers" && typeof s.servers === "object" && s.servers !== null) {
    return s.servers as Record<string, unknown>;
  }

  return s;
}
