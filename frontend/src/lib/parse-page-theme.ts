export function parsePageTheme(
  settings: unknown,
  pageSlug?: string
): Record<string, unknown> {
  const s = settings && typeof settings === "object" ? (settings as Record<string, unknown>) : null;
  if (!s) return {};

  if (pageSlug === "layout") {
    if (typeof s.layout === "object" && s.layout !== null) {
      return s.layout as Record<string, unknown>;
    }
    return s;
  }
  if (pageSlug === "home" && typeof s.home === "object" && s.home !== null) {
    return s.home as Record<string, unknown>;
  }
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
  if (pageSlug === "store" && typeof s.store === "object" && s.store !== null) {
    return s.store as Record<string, unknown>;
  }
  if (pageSlug === "servers" && typeof s.servers === "object" && s.servers !== null) {
    return s.servers as Record<string, unknown>;
  }
  if (pageSlug === "bans" && typeof s.bans === "object" && s.bans !== null) {
    return s.bans as Record<string, unknown>;
  }
  if (pageSlug === "link" && typeof s.link === "object" && s.link !== null) {
    return s.link as Record<string, unknown>;
  }
  if (pageSlug === "cms" && typeof s.cms === "object" && s.cms !== null) {
    return s.cms as Record<string, unknown>;
  }
  if (pageSlug === "terms-of-service" || pageSlug === "legal" || pageSlug === "privacy-policy") {
    if (pageSlug === "privacy-policy" && typeof s.privacy === "object" && s.privacy !== null) {
      return s.privacy as Record<string, unknown>;
    }
    if (typeof s.legal === "object" && s.legal !== null) {
      return s.legal as Record<string, unknown>;
    }
    if (typeof s["terms-of-service"] === "object" && s["terms-of-service"] !== null) {
      return s["terms-of-service"] as Record<string, unknown>;
    }
    if (typeof s["privacy-policy"] === "object" && s["privacy-policy"] !== null) {
      return s["privacy-policy"] as Record<string, unknown>;
    }
    return {};
  }

  return s;
}
