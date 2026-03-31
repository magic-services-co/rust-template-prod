"use client";

import useServerData from "@/hooks/use-server-data";
import { useLeaderboardTheme } from "@/hooks/use-leaderboard-theme";
import { withLeaderboardDefaults } from "@/lib/leaderboard-theme-defaults";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Summary strip styled like ban cards on the bans page (`cardBackground`, `cardBorder`, `hover:shadow-md`). */
export default function TotalPlayers({ theme: serverTheme }: { theme?: any }) {
    const { serverList: serverQueries, isLoading } = useServerData();
    const { data: clientTheme } = useLeaderboardTheme();
    const theme = withLeaderboardDefaults(clientTheme || serverTheme);

    const totalPlayers = useMemo(
        () =>
            serverQueries.reduce((acc, query) => {
                if (query.data) return acc + (query.data.attributes?.players ?? 0);
                return acc;
            }, 0),
        [serverQueries],
    );

    const cardStyle = {
        backgroundColor: theme.cardBackground,
        border: theme.cardBorder ? `1px solid ${theme.cardBorder}` : undefined,
        borderRadius: theme.cardBorderRadius,
        boxShadow: theme.cardShadow,
    } as const;

    if (isLoading) {
        return (
            <div className="flex justify-center my-4">
                <Card className="max-w-md w-full hover:shadow-md transition-shadow" style={cardStyle}>
                    <CardContent style={{ padding: theme.cardPadding }} className="text-center">
                        <div style={{ color: theme.textPrimaryColor }}>
                            <Loader2 className="animate-spin mx-auto" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center my-4">
            <Card className="max-w-md w-full hover:shadow-md transition-shadow" style={cardStyle}>
                <CardContent style={{ padding: theme.cardPadding }} className="text-center select-none">
                    <p
                        className="text-base font-medium md:text-lg"
                        style={{ color: theme.textPrimaryColor }}
                    >
                        Currently tracking{" "}
                        <span className="font-extrabold px-0.5">{totalPlayers}</span> unique players
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
