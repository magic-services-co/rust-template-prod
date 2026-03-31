"use client";

import { DollarSign, Gamepad, Gamepad2, LinkIcon, Ticket, User } from "lucide-react";
import { StatCard } from "./stat-card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { fetchDashboardData } from "@/app/actions/dashboard";
import useServerData from "@/hooks/use-server-data";
import { useMemo } from "react";

async function fetchStats() {
    return fetchDashboardData();
}

export function Stats() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['adminDashboardStats'],
        queryFn: () => fetchStats(),
    });

    const { serverList: serverQueries, isLoading: serversLoading, isError: serversError } = useServerData();
    const totalPlayers = useMemo(() => serverQueries.reduce((acc, query) => {
        if (query.data) {
            return acc + query.data.attributes.players;
        }
        return acc;
    }, 0), [serverQueries]);

    if (isLoading || !data || serversLoading) {
        return (
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
        );
    }

    if (error || serversError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load dashboard stats. Please try again later.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
                title="Total Users"
                value={data.stats.totalUsers.toLocaleString()}
                icon={User}
                subtitle={`${data.growth.users >= 0 ? '+' : ''}${data.growth.users}% from last month`}
            />
            <StatCard
                title="Total Linked Users"
                value={data.stats.totalLinkedUsers.toLocaleString()}
                icon={LinkIcon}
                subtitle={`${data.growth.linkedUsers >= 0 ? '+' : ''}${data.growth.linkedUsers}% from last month`}
            />
            <StatCard
                title="Total Tickets"
                value={data.stats.totalTickets.toLocaleString()}
                icon={Ticket}
                subtitle={`${data.growth.tickets >= 0 ? '+' : ''}${data.growth.tickets}% from last month`}
            />
            <StatCard
                title="Online Players"
                value={totalPlayers.toLocaleString()}
                icon={Gamepad2}
                subtitle={`Across ${data.stats.serverCount} servers`}
            />
        </div>
    );
}