"use client";

import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";
import { cn } from "@/lib/utils";
import { MapVote, UserVote } from "@/types/vote";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Check, ExternalLink } from "lucide-react";
import VoteResults from "./vote-results";
import Link from "next/link";

interface MapViewContainerProps {
    id: string;
    theme?: any;
}

export default function MapViewContainer({ id, theme }: MapViewContainerProps) {
    const queryClient = useQueryClient();
    const { data: mapVote, isLoading, error } = useQuery<MapVote>({
        queryKey: ["mapVote", id],
        queryFn: () => fetchMapVote(id),
    });

    const { data: userVotes } = useQuery<UserVote[]>({
        queryKey: ["userVotes"],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const response = await fetch(backendApi("vote"), { credentials: "include", headers });
            if (!response.ok) {
                if (response.status === 401) return [];
                throw new Error("Failed to fetch votes");
            }
            return response.json();
        },
    });

    const userVote = useMemo(() => {
        return userVotes?.find((vote) => vote.vote_id === id);
    }, [userVotes, id]);

    const isActive = useMemo(() => {
        const now = new Date();
        const startDate = new Date(mapVote?.vote_start || "");
        const endDate = new Date(mapVote?.vote_end || "");
        return now >= startDate && now < endDate;
    }, [mapVote]);

    return (
        <>
            <div className="flex flex-col items-center text-center">
                <h2 
                    className="mt-2 text-center text-4xl font-bold"
                    style={{ color: theme?.titleColor || "#ffffff" }}
                >
                    Map Voting
                </h2>
                <p 
                    className="max-w-[80ch] bg-transparent px-8 text-center leading-8 lg:px-0"
                    style={{ color: theme?.subtitleColor || "#b0b0b0" }}
                >
                    What map do you want to see on <span className="font-semibold">{mapVote?.server?.server_name}</span>?
                </p>
                <div 
                    className="select-none text-center my-4 py-2 px-4 rounded-lg"
                    style={{
                        backgroundColor: isActive 
                            ? (theme?.mapCardStatusActiveColor ? `${theme?.mapCardStatusActiveColor}20` : "#22c55e20")
                            : (theme?.mapCardStatusInactiveColor ? `${theme?.mapCardStatusInactiveColor}20` : "#ef444420"),
                        borderRadius: theme?.cardBorderRadius || "0.5rem"
                    }}
                >
                    {isActive ? (
                        <h1 
                            className="font-bold"
                            style={{ color: theme?.mapCardStatusActiveColor || "#22c55e" }}
                        >
                            Voting ends in {formatDistanceToNow(mapVote?.vote_end || new Date())}
                        </h1>
                    ) : (
                        mapVote?.map_start ? (
                            <h1 
                                className="font-bold"
                                style={{ color: theme?.mapCardStatusUpcomingColor || "#f59e0b" }}
                            >
                                Map starts in {formatDistanceToNow(mapVote?.map_start || new Date())}
                            </h1>
                        ) : (
                            <h1 
                                className="font-bold"
                                style={{ color: theme?.mapCardStatusInactiveColor || "#ef4444" }}
                            >
                                Voting is currently closed
                            </h1>
                        )
                    )}
                </div>
            </div>
            {!isActive && mapVote ? (
                <VoteResults vote={mapVote} theme={theme} />
            ) : null}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-lg bg-black/40 border border-white/20 px-6 min-h-[200px]">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                    <p className="text-center text-white font-medium">Loading map vote…</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-lg bg-red-950/60 border border-red-400/40 px-6 min-h-[200px]">
                    <p className="text-center text-red-100 font-medium">Failed to load map vote.</p>
                    <p className="text-center text-sm text-red-200 max-w-md">{error.message}</p>
                </div>
            ) : (
            <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                style={{ gap: theme?.spacing || '1rem' }}
            >
                {(mapVote?.map_options ?? []).map((option, index) => (
                    <MapOption
                        key={option.id}
                        voteId={mapVote?.id ?? ''}
                        isActive={isActive}
                        hasVoted={!!userVote}
                        userVoted={userVote && userVote.vote_option_id === option.id}
                        option={option}
                        index={index}
                        theme={theme}
                        onVoteSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ["mapVote", id] });
                            queryClient.invalidateQueries({ queryKey: ["userVotes"] });
                        }}
                    />
                ))}
            </div>
            )}
        </>
    )
}

type MapVoteVoteData = {
    vote_id: string;
    map_option_id: string;
}

function MapOption({ option, voteId, isActive, hasVoted = false, userVoted, index, theme, onVoteSuccess }: {
    option: MapVote['map_options'][number];
    voteId: string;
    isActive: boolean;
    index: number;
    hasVoted?: boolean;
    userVoted?: boolean;
    theme?: any;
    onVoteSuccess?: () => void;
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: async (data: MapVoteVoteData) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const response = await fetch(backendApi("vote"), {
                method: "POST",
                headers,
                body: JSON.stringify(data),
                credentials: "include",
            });
            if (!response.ok) {
                let message = "Failed to complete request";
                try {
                    const errorData = await response.json();
                    if (errorData?.error) message = errorData.error;
                    else if (errorData?.message) message = errorData.message;
                    else if (errorData?.errors && typeof errorData.errors === "object") {
                        const parts = Object.entries(errorData.errors).flatMap(([k, v]) =>
                            Array.isArray(v) ? v.map((s: string) => `${k}: ${s}`) : [`${k}: ${v}`]
                        );
                        if (parts.length) message = parts.join(". ");
                    }
                } catch {
                    if (response.status === 401) message = "Please log in to vote.";
                }
                if (response.status === 401 && message === "Failed to complete request") message = "Please log in to vote.";
                throw new Error(message);
            }
            return response.json()
        },
        onSuccess: () => {
            setIsDialogOpen(false);
            onVoteSuccess?.();
            toast.success("Your vote has been recorded");
        },
        onError: (error) => {
            toast.error(error.message || `Failed to complete request`)
        },
    })

    const handleVote = () => {
        mutation.mutate({
            vote_id: voteId,
            map_option_id: option.id
        });
    };

    const voteCount = option.vote_count ?? 0;
    const panelBg = theme?.mapCardBackground || "rgba(30, 30, 30, 0.95)";
    const buttonBorder = theme?.buttonSecondaryBorder || "#ffffff";
    const buttonText = theme?.buttonSecondaryText || "#ffffff";

    return (
        <Dialog open={isDialogOpen} onOpenChange={(open: boolean) => {
            if (!isActive || userVoted) {
                setIsDialogOpen(false);
            } else {
                setIsDialogOpen(open);
            }
        }}>
            <div
                className="select-none flex flex-col w-full overflow-hidden"
                style={{
                    border: `1px solid ${userVoted ? (theme?.mapCardBadgeActiveBackground || "#22c55e") : (theme?.mapCardBorder || "rgba(255, 255, 255, 0.15)")}`,
                    borderRadius: theme?.cardBorderRadius || "0.5rem",
                    backgroundColor: theme?.mapCardBackground || "rgba(30, 30, 30, 0.95)",
                }}
            >
                <div
                    className="text-sm font-medium px-3 py-2 flex items-baseline gap-1.5"
                    style={{
                        backgroundColor: theme?.mapCardVoteCountBackground || "rgba(0, 0, 0, 0.5)",
                        color: theme?.mapCardVoteCountText || "#ffffff",
                    }}
                >
                    <span className="text-lg font-bold">{voteCount}</span>
                    <span>VOTES #{index + 1}</span>
                </div>
                <div className="relative w-full overflow-hidden bg-black/30">
                    {/rustmaps\.com\/map\//i.test(option.imageIconUrl ?? "") ? (
                        <Image
                            src={option.imageIconUrl ?? ""}
                            alt={`Map option #${index + 1}`}
                            width={435}
                            height={435}
                            className="w-full h-auto block object-cover"
                            style={{ aspectRatio: "1", maxHeight: 435 }}
                            unoptimized
                        />
                    ) : (
                        <Image
                            src={option.imageIconUrl ?? ""}
                            alt={`Map option #${index + 1}`}
                            width={435}
                            height={435}
                            className="w-full h-auto block object-cover"
                        />
                    )}
                </div>
                <div
                    className="flex gap-2 p-2"
                    style={{
                        backgroundColor: panelBg,
                        borderTop: `1px solid ${theme?.mapCardBorder || "rgba(255, 255, 255, 0.1)"}`,
                    }}
                >
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!isActive || userVoted}
                            className="flex-1 min-w-0"
                            style={{
                                backgroundColor: panelBg,
                                color: buttonText,
                                border: `1px solid ${buttonBorder}`,
                                borderRadius: theme?.buttonBorderRadius || "0.375rem",
                                opacity: userVoted ? 0.6 : undefined,
                            }}
                        >
                            <Check className="size-4 shrink-0 mr-1.5" />
                            Vote
                        </Button>
                    </DialogTrigger>
                    <Link
                        href={`https://rustmaps.com/map/${String(option.id).replace(/-\d+$/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0"
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            style={{
                                backgroundColor: panelBg,
                                color: buttonText,
                                border: `1px solid ${buttonBorder}`,
                                borderRadius: theme?.buttonBorderRadius || "0.375rem",
                            }}
                        >
                            <ExternalLink className="size-4 shrink-0 mr-1.5" />
                            View Map
                        </Button>
                    </Link>
                </div>
            </div>
            <DialogContent 
                className=""
                style={{
                    backgroundColor: theme?.mapCardBackground || "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${theme?.mapCardBorder || "rgba(255, 255, 255, 0.1)"}`,
                    borderRadius: theme?.cardBorderRadius || "0.5rem"
                }}
            >
                <DialogHeader>
                    <DialogTitle style={{ color: theme?.mapCardTitleColor || "#ffffff" }}>
                        Confirm Vote
                    </DialogTitle>
                    <DialogDescription style={{ color: theme?.mapCardStatusTextColor || "#b0b0b0" }}>
                        {hasVoted
                            ? "Switch your vote to Map Option #" + (index + 1) + "? Your previous vote will be replaced."
                            : "Are you sure you want to vote for Map Option #" + (index + 1) + "?"}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        style={{
                            backgroundColor: theme?.buttonSecondaryBackground || "transparent",
                            color: theme?.buttonSecondaryText || "#9ca3af",
                            border: `1px solid ${theme?.buttonSecondaryBorder || "#374151"}`,
                            borderRadius: theme?.buttonBorderRadius || "0.375rem"
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleVote} 
                        disabled={mutation.isPending}
                        style={{
                            backgroundColor: theme?.buttonPrimaryBackground || "#52525b",
                            color: theme?.buttonPrimaryText || "#ffffff",
                            borderRadius: theme?.buttonBorderRadius || "0.375rem"
                        }}
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin" /> : "Confirm"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

async function fetchMapVote(id: string): Promise<MapVote> {
    const response = await fetch(backendApi(`maps/${id}`), { credentials: "include" });
    if (!response.ok) {
        throw new Error("Failed to fetch map vote");
    }
    return response.json();
}