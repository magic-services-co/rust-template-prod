"use client";

/**
 * Bans page uses {@link BansThemeProvider} with no full-page backdrop wrapper — only merged theme in context.
 * Leaderboard theme is read per-component via {@link useLeaderboardTheme}; this provider matches bans by not
 * wrapping the tree in background/blur layers.
 */
interface LeaderboardThemeProviderProps {
    children: React.ReactNode;
}

export function LeaderboardThemeProvider({ children }: LeaderboardThemeProviderProps) {
    return <>{children}</>;
}
