"use client";

import Server from "@/components/server";
import useServerData, { EnhancedServerData } from "@/hooks/use-server-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useServerTheme } from "@/hooks/use-server-theme";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HomeServersProps {
    serverTheme?: any;
}

export default function HomeServers({ serverTheme }: HomeServersProps) {
    const siteSettings = useSiteSettings();
    const { serverList: serverQueries, isLoading, isError } = useServerData();
    const { data: clientTheme } = useServerTheme();
    
    const theme = clientTheme || serverTheme;

    if (siteSettings.isLoading || isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[400px] w-full" />
                ))}
            </div>
        );
    }

    if (isError) {
        return null;
    }

    const allServers: EnhancedServerData[] = serverQueries
        .map(query => query.data)
        .filter((server): server is EnhancedServerData => server !== undefined);

    const sortedServers = [...allServers].sort((a, b) => 
        (b.attributes.players || 0) - (a.attributes.players || 0)
    );

    const topServers = sortedServers.slice(0, 6);
    const hasMoreServers = sortedServers.length > 6;

    if (topServers.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            <div 
                className={cn(
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                    hasMoreServers && "pb-16"
                )}
                style={{ gap: theme?.spacing || '1rem' }}
            >
                {topServers.map((server) => (
                    <Server
                        key={server.id}
                        data={server}
                        copyServerAddress={siteSettings.data?.copyServerAddress || false}
                        serverTheme={theme}
                    />
                ))}
            </div>
            {hasMoreServers && (
                <>
                    <div 
                        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                        style={{
                            background: `linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)`,
                        }}
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center pointer-events-auto z-10">
                        <Link
                            href="/servers"
                            className={cn(
                                "px-6 py-3 rounded-md font-medium transition-colors duration-200"
                            )}
                            style={{
                                backgroundColor: theme?.buttonPrimaryBg || '#52525b',
                                color: theme?.buttonPrimaryText || '#ffffff',
                                borderRadius: theme?.buttonBorderRadius || '0.375rem',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBg || '#71717a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBg || '#52525b';
                            }}
                        >
                            View More
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}