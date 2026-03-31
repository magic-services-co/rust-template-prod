"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapVote, UserVote } from "@/types/vote";
import { Button, buttonVariants } from "../ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMapsTheme } from "@/hooks/use-maps-theme";

interface MapProps {
    vote: MapVote
    userVote?: UserVote
    serverTheme?: any
}

export default function Map({ vote, userVote, serverTheme }: MapProps) {
    const { data: clientTheme } = useMapsTheme();
    
    const theme = clientTheme || serverTheme;
    const voteCount = vote.map_options.reduce((acc, option) => acc + (option.vote_count || 0), 0);

    const startDate = useMemo(() => new Date(vote.vote_start), [vote.vote_start]);
    const mapStartDate = useMemo(() => new Date(vote.map_start), [vote.map_start]);
    const endDate = useMemo(() => new Date(vote.vote_end), [vote.vote_end]);

    const now = useMemo(() => new Date(), []);
    const isActive = now >= startDate && now < endDate;
    const isEnded = now > endDate;

    const statusText = useMemo(() => {
        if (isEnded) {
            if (mapStartDate && now < mapStartDate) {
                return "Map starts";
            }
            return "Ended";
        }
        if (isActive) {
            return "Ends";
        }
        return "Starts";
    }, [isActive, isEnded, mapStartDate, now]);

    const formattedDate = useMemo(() => {
        return format(now, 'MMM d, yyyy');
    }, [now]);

    const getStatusColor = () => {
        if (isEnded) return theme?.mapCardStatusInactiveColor || "#ef4444";
        if (isActive) return theme?.mapCardStatusActiveColor || "#22c55e";
        return theme?.mapCardStatusUpcomingColor || "#3b82f6";
    };

    return (
        <Card 
            className="mb-4 hover:brightness-110 transition-all duration-300"
            style={{
                backgroundColor: theme?.mapCardBackground || "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${theme?.mapCardBorder || "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: theme?.cardBorderRadius || "0.5rem",
                boxShadow: theme?.cardShadow || "0 4px 6px rgba(0, 0, 0, 0.1)"
            }}
        >
            <CardHeader style={{ padding: theme?.cardPadding || "1rem" }}>
                <CardTitle 
                    className="flex justify-between items-center"
                    style={{ color: theme?.mapCardServerNameColor || "#ffffff" }}
                >
                    <span>{vote.server?.server_name}</span>
                    {isEnded ? (
                        <Badge 
                            variant="secondary"
                            style={{
                                backgroundColor: theme?.mapCardVoteCountBackground || "rgba(255, 255, 255, 0.1)",
                                color: theme?.mapCardVoteCountText || "#ffffff",
                                borderRadius: theme?.buttonBorderRadius || "0.375rem"
                            }}
                        >
                            {voteCount.toLocaleString()} votes
                        </Badge>
                    ) : null}
                    {!!userVote ? (
                        <Badge 
                            variant="active"
                            style={{
                                backgroundColor: theme?.mapCardBadgeActiveBackground || "#22c55e",
                                color: theme?.mapCardBadgeActiveText || "#ffffff",
                                borderRadius: theme?.buttonBorderRadius || "0.375rem"
                            }}
                        >
                            Voted
                        </Badge>
                    ) : null}
                </CardTitle>
                <p 
                    className="text-sm font-semibold"
                    style={{
                        color: getStatusColor()
                    }}
                >
                    {statusText} {formatDistanceToNow(isEnded ? mapStartDate : (isActive ? endDate : startDate), { addSuffix: true })}
                </p>
            </CardHeader>
            <CardContent style={{ padding: theme?.cardPadding || "1rem" }}>
                <Link
                    href={`/maps/${vote.id}`}
                    className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "w-full hover:opacity-80 transition-opacity",
                    )}
                    style={{
                        backgroundColor: theme?.buttonSecondaryBackground || "transparent",
                        color: theme?.buttonSecondaryText || "#9ca3af",
                        border: `1px solid ${theme?.buttonSecondaryBorder || "#374151"}`,
                        borderRadius: theme?.buttonBorderRadius || "0.375rem"
                    }}
                >
                    View Vote
                </Link>
            </CardContent>
        </Card>
    );
}