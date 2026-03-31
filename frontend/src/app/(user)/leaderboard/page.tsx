import { StatsTableContainer } from "@/components/stats/table-container";
import { LeaderboardThemeProvider } from "@/components/leaderboard-theme-provider";
import { Suspense } from "react";
import { getMetadata } from "@/lib/metadata";
import { backendApi } from "@/lib/api";
import { parsePageTheme } from "@/lib/parse-page-theme";
import { withLeaderboardDefaults } from "@/lib/leaderboard-theme-defaults";

export const revalidate = 60;

export async function generateMetadata() {
  return await getMetadata('leaderboard');
}

export default async function Page() {
    const res = await fetch(backendApi("data?include=pageTheme:leaderboard"), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const pageTheme = data.pageTheme;
    const raw = parsePageTheme(pageTheme && "settings" in pageTheme ? pageTheme.settings : undefined, "leaderboard");
    const theme = withLeaderboardDefaults(raw);

    return (
        <LeaderboardThemeProvider>
            <div className="min-h-screen pb-16 pt-28 md:pt-32">
                <div className="container max-w-[1600px] space-y-4 px-3 sm:px-4 md:px-6">
                    <Suspense>
                        <StatsTableContainer leaderboardTheme={theme} />
                    </Suspense>
                </div>
            </div>
        </LeaderboardThemeProvider>
    )
}