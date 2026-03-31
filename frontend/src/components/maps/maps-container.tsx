"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Map from "./map";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapVote, UserVote } from "@/types/vote";
import { Select } from "@radix-ui/react-select";
import { useMapsTheme } from "@/hooks/use-maps-theme";
import { backendApi } from "@/lib/api";

async function fetchMapVotes(): Promise<MapVote[]> {
    const response = await fetch(backendApi("maps"), { credentials: "include" });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch map votes: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

interface MapsContainerProps {
    serverTheme?: any;
}

export default function MapsContainer({ serverTheme }: MapsContainerProps) {
    const { data: clientTheme } = useMapsTheme();
    
    const theme = clientTheme || serverTheme;
    
    const [search, setSearch] = useState("");
    const { data: mapVotes, isLoading, error } = useQuery<MapVote[]>({
        queryKey: ["mapVotes"],
        queryFn: fetchMapVotes,
        retry: 1,
    });

    const { data: userVotes, isLoading: userVoteLoading, error: userVoteError } = useQuery<UserVote[]>({
        queryKey: ["userVotes", mapVotes?.map(vote => vote.id)],
        queryFn: async () => {
            if (!mapVotes?.length) return [];
            
            const votes = await Promise.all(
                mapVotes.map(async (vote) => {
                    const response = await fetch(backendApi(`vote?voteId=${vote.id}`), { credentials: "include" });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || `Failed to fetch user votes: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
            );
            
            return votes.flat();
        },
        enabled: !!mapVotes?.length,
        retry: 1,
    });

    const activeVotes = useMemo(() => {
        const now = new Date();
        return mapVotes?.filter((vote) => now >= new Date(vote.vote_start) && now < new Date(vote.vote_end))
            .filter((vote) =>
                vote.server?.server_name?.toLowerCase().includes(search.toLowerCase()) ?? false
            );
    }, [mapVotes, search]);

    const inactiveVotes = useMemo(() => {
        const now = new Date();
        return mapVotes?.filter((vote) => now > new Date(vote.vote_end))
            .filter((vote) =>
                vote.server?.server_name?.toLowerCase().includes(search.toLowerCase()) ?? false
            );
    }, [mapVotes, search]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div 
                    className="max-w-xs w-full h-10 rounded-lg"
                    style={{
                        backgroundColor: theme?.loadingSkeletonBackground || "rgba(255, 255, 255, 0.1)",
                        borderRadius: theme?.cardBorderRadius || "0.5rem"
                    }}
                />
                <div 
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                    style={{ gap: theme?.spacing || '1rem' }}
                >
                    {[...Array(6)].map((_, index) => (
                        <div 
                            key={index} 
                            className="w-full h-28 rounded-lg"
                            style={{
                                backgroundColor: theme?.loadingSkeletonBackground || "rgba(255, 255, 255, 0.1)",
                                borderRadius: theme?.cardBorderRadius || "0.5rem"
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        console.error('Map votes error:', error);
        return (
            <div className="space-y-4">
                <div 
                    className="p-4 rounded-lg border"
                    style={{
                        backgroundColor: theme?.errorBackground || "rgba(239, 68, 68, 0.1)",
                        borderColor: theme?.errorBorder || "#ef4444",
                        borderRadius: theme?.cardBorderRadius || "0.5rem"
                    }}
                >
                    <h3 
                        className="font-semibold mb-2"
                        style={{ color: theme?.errorTextColor || "#ef4444" }}
                    >
                        Error loading map votes
                    </h3>
                    <p 
                        className="text-sm"
                        style={{ color: theme?.errorTextColor || "#ef4444" }}
                    >
                        {error instanceof Error ? error.message : 'An unknown error occurred'}
                    </p>
                </div>
            </div>
        );
    }

    if (userVoteError) {
        console.error('User votes error:', userVoteError);
    }

    return (
        <div className="space-y-6" style={{ gap: theme?.spacing || '1.5rem' }}>
            <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Search Servers"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-grow max-w-xs"
                    style={{
                        backgroundColor: theme?.searchInputBackground || "rgba(255, 255, 255, 0.1)",
                        borderColor: theme?.searchInputBorder || "rgba(255, 255, 255, 0.2)",
                        color: theme?.searchInputText || "#ffffff",
                        borderRadius: theme?.cardBorderRadius || "0.5rem"
                    }}
                />
            </div>
            <div className="space-y-4" style={{ gap: theme?.spacing || '1rem' }}>
                <div className="space-y-4 text-muted-foreground">
                    <h3 
                        className="text-lg font-semibold"
                        style={{
                            color: theme?.sectionTitleColor || "#ffffff",
                            fontSize: theme?.sectionTitleSize || "1.125rem"
                        }}
                    >
                        Active Map Votes
                    </h3>
                    <div 
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                        style={{ gap: theme?.spacing || '1rem' }}
                    >
                        {activeVotes?.map((mapVote) => (
                            <Map 
                                key={mapVote.id} 
                                userVote={userVotes?.find((vote) => vote.vote_id === mapVote.id)} 
                                vote={mapVote} 
                                serverTheme={theme}
                            />
                        ))}
                    </div>
                </div>
                {inactiveVotes && inactiveVotes.length > 0 && (
                    <div className="space-y-4 text-muted-foreground">
                        <h3 
                            className="text-lg font-semibold"
                            style={{
                                color: theme?.sectionTitleColor || "#ffffff",
                                fontSize: theme?.sectionTitleSize || "1.125rem"
                            }}
                        >
                            Inactive Map Votes
                        </h3>
                        <div 
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                            style={{ gap: theme?.spacing || '1rem' }}
                        >
                            {inactiveVotes.map((mapVote) => (
                                <Map 
                                    key={mapVote.id} 
                                    vote={mapVote} 
                                    serverTheme={theme}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}