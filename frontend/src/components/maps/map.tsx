"use client";

import { MapVote, UserVote } from "@/types/vote";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import Link from "next/link";
import { withMapsDefaults } from "@/lib/maps-theme-defaults";
import { useMapsTheme } from "@/hooks/use-maps-theme";
import { HomeCardCorners } from "@/components/home/home-card-corners";

interface MapProps {
    vote: MapVote
    userVote?: UserVote
    serverTheme?: Record<string, unknown>
}

export default function Map({ vote, userVote, serverTheme }: MapProps) {
    const { data: clientTheme } = useMapsTheme();
    const theme = withMapsDefaults(clientTheme || serverTheme);
    const voteCount = vote.map_options.reduce((acc, option) => acc + (option.vote_count || 0), 0);

    const startDate = useMemo(() => new Date(vote.vote_start), [vote.vote_start]);
    const mapStartDate = useMemo(() => new Date(vote.map_start), [vote.map_start]);
    const endDate = useMemo(() => new Date(vote.vote_end), [vote.vote_end]);
    const now = useMemo(() => new Date(), []);
    const isActive = now >= startDate && now < endDate;
    const isEnded = now > endDate;

    const statusText = useMemo(() => {
        if (isEnded) {
            if (mapStartDate && now < mapStartDate) return "Map starts";
            return "Ended";
        }
        if (isActive) return "Ends";
        return "Starts";
    }, [isActive, isEnded, mapStartDate, now]);

    const statusWhen = isEnded ? mapStartDate : isActive ? endDate : startDate;

    return (
        <Link href={`/maps/${vote.id}`} className="block">
            <article
                className="support-ticket-card relative overflow-visible border p-5"
                style={{
                    borderColor: "rgba(165,177,187,0.17)",
                    backgroundImage:
                        "linear-gradient(146.62deg, rgba(17, 24, 29, 0.93) 0%, rgba(7, 11, 15, 0.94) 100%)",
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[18px] font-medium tracking-[-0.4px] text-[#eef4fb]">
                        {vote.server?.server_name}
                    </h3>
                    {userVote ? (
                        <span
                            className="shrink-0 border px-2 py-1 text-[9px] tracking-[1.35px]"
                            style={{
                                borderColor: "rgba(214,168,80,0.55)",
                                backgroundColor: "rgba(24,20,10,0.85)",
                                color: theme.mapCardBadgeActiveText,
                            }}
                        >
                            VOTED
                        </span>
                    ) : (
                        <span className="shrink-0 text-[9px] tracking-[1px] text-[#a5b1bb]">
                            {voteCount.toLocaleString()} VOTES
                        </span>
                    )}
                </div>
                <p className="pt-2 text-[12px]" style={{ color: isActive ? theme.mapCardStatusActiveColor : theme.mapCardStatusInactiveColor }}>
                    {statusText} {formatDistanceToNow(statusWhen, { addSuffix: true })}
                </p>
                <p className="pt-5 text-[10px] tracking-[1.5px] text-[#a5b1bb]">
                    {isActive ? "CLICK TO VOTE" : "VIEW RESULTS"}
                    <span className="float-right text-[#d6a850]">→</span>
                </p>
                <HomeCardCorners color="#ba9142" show />
            </article>
        </Link>
    );
}
