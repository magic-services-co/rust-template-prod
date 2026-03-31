"use client";

import DynamicBreadcrumbs from "@/components/dynamic-breadcrumbs";
import ServerList from "./server-list";
import { Suspense } from "react";
import TotalPlayers from "./total-players";
import { ServerThemeProvider } from "@/components/server-theme-provider";
import { ServerTitles } from "@/components/server-titles";
import { LeaderboardThemeProvider } from "@/components/leaderboard-theme-provider";

export type ServersPageClientProps = {
  theme: Record<string, unknown>;
  rustalyzerEnabled: boolean;
};

export function ServersPageClient({ theme, rustalyzerEnabled }: ServersPageClientProps) {
  return (
    <LeaderboardThemeProvider>
      <ServerThemeProvider serverTheme={theme}>
        <div className="min-h-screen pb-16 pt-28 md:pt-32">
          <div className="container max-w-[1600px] space-y-4 px-3 sm:px-4 md:px-6">
            <ServerTitles serverTheme={theme} />
            <TotalPlayers theme={theme} />
            <div className="pb-1">
              <Suspense>
                <DynamicBreadcrumbs />
              </Suspense>
            </div>
            <ServerList serverTheme={theme} initialRustalyzerEnabled={rustalyzerEnabled} />
          </div>
        </div>
      </ServerThemeProvider>
    </LeaderboardThemeProvider>
  );
}
