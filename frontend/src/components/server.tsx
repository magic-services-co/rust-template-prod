"use client";

import { cn } from "@/lib/utils";
import { ServerData } from "@/hooks/use-server-data";
import { getServerConnectAddress, getServerImageUrl } from "@/lib/server-card-helpers";
import { CheckIcon, CirclePlayIcon, CopyIcon, MapIcon, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import Link from "next/link";
import { ServerDetailsDialog } from "./server-details-dialog";

type ServerTheme = Record<string, unknown> | undefined;

function themeStr(t: ServerTheme, keys: string[], fallback: string): string {
  if (!t) return fallback;
  for (const k of keys) {
    const v = t[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return fallback;
}

export default function Server({
  data,
  copyServerAddress,
  serverTheme,
  categoryName,
}: {
  data: ServerData;
  copyServerAddress: boolean;
  serverTheme?: ServerTheme;
  /** Shown in details modal subtitle (e.g. category label). */
  categoryName?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const percentage = useMemo(() => {
    const max = data.attributes.maxPlayers || 1;
    return Math.min(100, (100 * (data.attributes.players || 0)) / max);
  }, [data]);

  const imageUrl = useMemo(() => getServerImageUrl(data), [data]);
  const isOnline = data.attributes.status.toLowerCase() === "online";

  const hoverClass = (() => {
    const effect = serverTheme?.cardHoverEffect;
    if (effect === "lift") return "hover:-translate-y-1";
    if (effect === "scale") return "hover:scale-[1.02]";
    if (effect === "glow") return "hover:shadow-xl hover:shadow-red-500/10";
    return "hover:border-white/[0.14] hover:shadow-lg hover:shadow-black/40";
  })();

  const borderCol = themeStr(serverTheme, ["borderColor", "contentCardBorder"], "rgba(255, 255, 255, 0.1)");
  const cardBg = themeStr(serverTheme, ["cardBackground", "contentCardBackground"], "rgba(14, 16, 20, 0.92)");
  const radius = themeStr(serverTheme, ["cardBorderRadius"], "0.75rem");
  const shadow = themeStr(serverTheme, ["cardShadow"], "0 8px 30px rgba(0, 0, 0, 0.35)");
  const titleColor = themeStr(serverTheme, ["titleTextColor", "titleColor", "contentCardTitleColor"], "#f8fafc");
  const mutedColor = themeStr(serverTheme, ["wipeTextColor", "textSecondaryColor", "secondaryTextColor"], "#94a3b8");
  const progressTrack = themeStr(serverTheme, ["progressBarBackground"], "rgba(255,255,255,0.08)");
  const progressFill = themeStr(serverTheme, ["progressBarForeground"], "#ef4444");
  const imageTint = themeStr(serverTheme, ["serverImageOverlay"], "rgba(0, 0, 0, 0.35)");
  const rankBg = themeStr(serverTheme, ["rankBadgeBackground"], "rgba(0, 0, 0, 0.55)");
  const rankFg = themeStr(serverTheme, ["rankBadgeTextColor"], "#ffffff");
  const pad = themeStr(serverTheme, ["cardPadding"], "1rem");
  const space = themeStr(serverTheme, ["spacing"], "0.75rem");
  const btnRadius = themeStr(serverTheme, ["buttonBorderRadius"], "0.5rem");
  const primaryBg = themeStr(serverTheme, ["buttonPrimaryBackground", "buttonPrimaryBg"], "#ef4444");
  const primaryText = themeStr(serverTheme, ["buttonPrimaryText"], "#ffffff");
  const primaryHover = themeStr(serverTheme, ["buttonPrimaryHover", "buttonPrimaryHoverBg"], "#dc2626");
  const secondaryBg = themeStr(serverTheme, ["buttonSecondaryBackground", "buttonSecondaryBg"], "transparent");
  const secondaryText = themeStr(serverTheme, ["buttonSecondaryText"], "#cbd5e1");
  const secondaryBorder = themeStr(serverTheme, ["buttonSecondaryBorder"], "rgba(255,255,255,0.14)");
  const secondaryHover = themeStr(serverTheme, ["buttonSecondaryHoverBackground", "buttonSecondaryHoverBg"], "rgba(255,255,255,0.06)");

  const displayName = data.name || data.attributes.name;
  const hasMapVote = Boolean(data.mapVotes);
  const useTwoColActions = hasMapVote;

  const openDetails = () => setDetailsOpen(true);
  const onKeyOpenDetails = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetails();
    }
  };

  return (
    <TooltipProvider delayDuration={280}>
      <article
        className={cn(
          "group relative flex flex-col overflow-hidden border border-border bg-card/40 backdrop-blur-md transition-all duration-300 ease-out",
          hoverClass,
        )}
        style={{
          backgroundColor: cardBg,
          borderColor: borderCol,
          borderRadius: radius,
          boxShadow: shadow,
        }}
      >
        <ServerDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          data={data}
          categoryName={categoryName}
          copyServerAddress={copyServerAddress}
          serverTheme={serverTheme}
        />

        <div
          role="button"
          tabIndex={0}
          className="relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          onClick={openDetails}
          onKeyDown={onKeyOpenDetails}
          aria-label={`View details for ${displayName ?? "server"}`}
        >
          {data.attributes.rank != null ? (
            <div
              className="absolute left-3 top-3 z-20 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-bold tabular-nums tracking-wide backdrop-blur-md pointer-events-none"
              style={{
                backgroundColor: rankBg,
                color: rankFg,
              }}
            >
              #{data.attributes.rank}
            </div>
          ) : null}

          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-950">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              style={{
                backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: imageUrl ? imageTint : "rgba(24, 24, 27, 0.92)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/20"
              aria-hidden
            />
            {!imageUrl ? (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                <Users className="h-14 w-14 opacity-40" aria-hidden />
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 pt-8">
              <h3
                className="line-clamp-2 min-w-0 text-base font-semibold leading-snug tracking-tight text-white drop-shadow-md sm:text-lg"
                style={{ color: imageUrl ? "#fff" : titleColor }}
              >
                {displayName}
              </h3>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
                  isOnline ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30" : "bg-red-500/15 text-red-300 ring-red-500/25",
                )}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3" style={{ padding: pad, gap: space }}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium" style={{ color: mutedColor }}>
              {data.attributes.details?.rust_last_wipe ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-white/20 underline-offset-2">
                      Wipe {formatDistanceToNow(data.attributes.details.rust_last_wipe, { addSuffix: true })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {format(data.attributes.details.rust_last_wipe, "MMM d, yyyy h:mm a")}
                  </TooltipContent>
                </Tooltip>
              ) : null}
              {data.attributes.details?.rust_next_wipe ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-white/20 underline-offset-2">
                      Next {formatDistanceToNow(data.attributes.details.rust_next_wipe, { addSuffix: true })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {format(data.attributes.details.rust_next_wipe, "MMM d, yyyy h:mm a")}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs" style={{ color: mutedColor }}>
                <span className="font-medium">Population</span>
                <span className="tabular-nums" style={{ color: titleColor }}>
                  {data.attributes.players} / {data.attributes.maxPlayers}
                </span>
              </div>
              <div
                className="relative h-2.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: progressTrack }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: progressFill,
                    boxShadow: percentage > 0 ? `0 0 12px ${progressFill}55` : undefined,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06]" style={{ padding: pad, paddingTop: space }}>
          <div
            className={cn("grid grid-cols-1 gap-2", useTwoColActions && "sm:grid-cols-2")}
            style={{ gap: space }}
          >
            {copyServerAddress ? (
              <CopyButton
                text={getServerConnectAddress(data)}
                serverTheme={serverTheme}
                fullWidth={!useTwoColActions}
              />
            ) : (
              <a
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold tracking-wide transition-colors"
                style={{
                  backgroundColor: primaryBg,
                  color: primaryText,
                  borderRadius: btnRadius,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primaryBg;
                }}
                href={getServerConnectAddress(data) ? `steam://connect/${getServerConnectAddress(data)}` : "#"}
              >
                <CirclePlayIcon className="h-4 w-4 shrink-0" aria-hidden />
                Connect
              </a>
            )}
            {data.mapVotes ? (
              <Link
                href={`/maps/${data.mapVotes.id}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold tracking-wide transition-colors"
                style={{
                  backgroundColor: secondaryBg,
                  color: secondaryText,
                  borderColor: secondaryBorder,
                  borderRadius: btnRadius,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = secondaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = secondaryBg;
                }}
              >
                <MapIcon className="h-4 w-4 shrink-0" aria-hidden />
                Map vote
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    </TooltipProvider>
  );
}

function CopyButton({
  text,
  serverTheme,
  fullWidth,
}: {
  text: string;
  serverTheme?: ServerTheme;
  fullWidth?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const secondaryBg = themeStr(serverTheme, ["buttonSecondaryBackground", "buttonSecondaryBg"], "transparent");
  const secondaryText = themeStr(serverTheme, ["buttonSecondaryText"], "#cbd5e1");
  const secondaryBorder = themeStr(serverTheme, ["buttonSecondaryBorder"], "rgba(255,255,255,0.14)");
  const secondaryHover = themeStr(serverTheme, ["buttonSecondaryHoverBackground", "buttonSecondaryHoverBg"], "rgba(255,255,255,0.06)");
  const btnRadius = themeStr(serverTheme, ["buttonBorderRadius"], "0.5rem");
  const ok = themeStr(serverTheme, ["statusOnlineColor", "buttonSuccessBackground"], "#34d399");

  const handleCopy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-semibold tracking-wide transition-colors",
        fullWidth && "sm:col-span-2",
      )}
      style={{
        backgroundColor: secondaryBg,
        color: secondaryText,
        borderColor: secondaryBorder,
        borderRadius: btnRadius,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = secondaryHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = secondaryBg;
      }}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 shrink-0" style={{ color: ok }} aria-hidden />
      ) : (
        <CopyIcon className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {copied ? "Copied" : "Copy address"}
    </button>
  );
}
