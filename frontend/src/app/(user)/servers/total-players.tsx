"use client";

import useServerData from "@/hooks/use-server-data";
import { useServerTheme } from "@/hooks/use-server-theme";
import { useMemo } from "react";
import { Users } from "lucide-react";

export default function TotalPlayers({ theme }: { theme?: Record<string, unknown> }) {
  const { serverList: serverQueries } = useServerData();
  const { data: clientTheme } = useServerTheme();
  const serverTheme = (clientTheme ?? theme) as Record<string, unknown> | undefined;

  const totalPlayers = useMemo(
    () =>
      serverQueries.reduce((acc, query) => {
        if (query.data) {
          return acc + query.data.attributes.players;
        }
        return acc;
      }, 0),
    [serverQueries],
  );

  const cardBg =
    (serverTheme?.playerCountBg as string | undefined) ??
    (serverTheme?.playerCountBackground as string | undefined) ??
    "rgba(255, 255, 255, 0.08)";
  const cardText =
    (serverTheme?.playerCountText as string | undefined) ??
    (serverTheme?.playerCountTextColor as string | undefined) ??
    "#e5e7eb";

  return (
    <div
      className="rounded-lg border border-border px-4 py-3 md:px-5 md:py-4"
      style={{
        backgroundColor: cardBg,
        borderColor: (serverTheme?.borderColor as string | undefined) ?? undefined,
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
        <Users className="h-4 w-4 shrink-0 text-emerald-400/90" aria-hidden />
        <p className="text-sm font-medium md:text-[15px]" style={{ color: cardText }}>
          <span
            className="opacity-80"
            style={{
              color: (serverTheme?.secondaryTextColor as string | undefined) ?? undefined,
            }}
          >
            Players online ·{" "}
          </span>
          <span className="font-semibold tabular-nums" style={{ color: cardText }}>
            {totalPlayers}
          </span>
        </p>
      </div>
    </div>
  );
}