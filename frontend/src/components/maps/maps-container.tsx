"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Map from "./map";
import { MapVote, UserVote } from "@/types/vote";
import { useMapsTheme } from "@/hooks/use-maps-theme";
import { backendApi } from "@/lib/api";
import { withMapsDefaults } from "@/lib/maps-theme-defaults";
import { ProfileSearch } from "@/components/profile/profile-ui";
import { ErrorCta, ErrorHint } from "@/components/error-page";

async function fetchMapVotes(): Promise<MapVote[]> {
    const response = await fetch(backendApi("maps"), { credentials: "include" });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch map votes: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

interface MapsContainerProps {
    serverTheme?: Record<string, unknown>;
}

export default function MapsContainer({ serverTheme }: MapsContainerProps) {
    const { data: clientTheme } = useMapsTheme();
    const theme = withMapsDefaults(clientTheme || serverTheme);
    const [search, setSearch] = useState("");
    const { data: mapVotes, isLoading, error } = useQuery<MapVote[]>({
        queryKey: ["mapVotes"],
        queryFn: fetchMapVotes,
        retry: 1,
    });

    const { data: userVotes } = useQuery<UserVote[]>({
        queryKey: ["userVotes", mapVotes?.map(vote => vote.id)],
        queryFn: async () => {
            if (!mapVotes?.length) return [];
            const votes = await Promise.all(
                mapVotes.map(async (vote) => {
                    const response = await fetch(backendApi(`vote?voteId=${vote.id}`), { credentials: "include" });
                    if (!response.ok) return [];
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="h-36 border border-white/10 bg-white/[0.03]" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-[555px]">
                <ErrorHint>
                    <p className="font-mono text-[11px] uppercase tracking-[1.4px] text-[#e8a0a3]">
                        Could not load maps
                    </p>
                    <p className="pt-2">
                        {error instanceof Error ? error.message : "An unknown error occurred"}
                    </p>
                </ErrorHint>
                <div className="flex justify-center pt-6">
                    <ErrorCta href="/servers" variant="secondary">
                        VIEW SERVERS
                    </ErrorCta>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <ProfileSearch
                value={search}
                onChange={setSearch}
                placeholder="Search servers…"
                className="h-[42px] max-w-md"
            />
            <section>
                <p className="flex items-center gap-2 pb-4 text-[9px] tracking-[3px] text-[#c59a48]">
                    <span className="inline-block h-px w-6 bg-[#8b6c32]" />
                    ACTIVE MAP VOTES
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {activeVotes?.length ? activeVotes.map((mapVote) => (
                        <Map
                            key={mapVote.id}
                            userVote={userVotes?.find((vote) => vote.vote_id === mapVote.id)}
                            vote={mapVote}
                            serverTheme={theme}
                        />
                    )) : (
                        <p className="col-span-full text-sm text-[#8292a6]">No active map votes.</p>
                    )}
                </div>
            </section>
            {inactiveVotes && inactiveVotes.length > 0 ? (
                <section>
                    <p className="flex items-center gap-2 pb-4 text-[9px] tracking-[3px] text-[#c59a48]">
                        <span className="inline-block h-px w-6 bg-[#8b6c32]" />
                        PAST MAP VOTES
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {inactiveVotes.map((mapVote) => (
                            <Map key={mapVote.id} vote={mapVote} serverTheme={theme} />
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
