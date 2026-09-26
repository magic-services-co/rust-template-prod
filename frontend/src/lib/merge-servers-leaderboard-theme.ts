import { withLeaderboardDefaults } from "@/lib/leaderboard-theme-defaults";
import { parsePageTheme } from "@/lib/parse-page-theme";
import { withServersDefaults } from "@/lib/servers-theme-defaults";

function settingsFromPageThemePayload(pageTheme: unknown): unknown {
  if (!pageTheme || typeof pageTheme !== "object" || !("settings" in pageTheme)) {
    return undefined;
  }
  const raw = (pageTheme as { settings: unknown }).settings;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return {};
    }
  }
  return raw;
}

export type ServersPageMergedTheme = Record<string, unknown>;

/**
 * Theme tokens for the Servers page: leaderboard design system first, then `servers` page overrides from admin.
 */
export function mergeServersPageThemeWithLeaderboard(
  serversParsed: Record<string, unknown>,
  leaderboardParsed: Record<string, unknown>,
): ServersPageMergedTheme {
  const lb = withLeaderboardDefaults(leaderboardParsed);
  const servers = withServersDefaults(serversParsed);
  return withServersDefaults({ ...lb, ...servers });
}

export function buildServersPageThemeFromApiPayloads(
  serversPayload: { pageTheme?: unknown },
  leaderboardPayload: { pageTheme?: unknown },
): ServersPageMergedTheme {
  const serversPart = parsePageTheme(settingsFromPageThemePayload(serversPayload.pageTheme), "servers");
  const lbPart = parsePageTheme(settingsFromPageThemePayload(leaderboardPayload.pageTheme), "leaderboard");
  return mergeServersPageThemeWithLeaderboard(serversPart, lbPart);
}
