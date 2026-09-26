"use client";

import Server from "@/components/server";
import { RustalyzerWidget } from "@/components/rustalyzer-widget";
import useServerData, { EnhancedServerData } from "@/hooks/use-server-data";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { SERVERS_THEME_DEFAULTS, withServersDefaults } from "@/lib/servers-theme-defaults";
import { useServerTheme } from "@/hooks/use-server-theme";

function getRustalyzerServerId(server: EnhancedServerData): string {
    if (server.server_address) return server.server_address;
    const addr = server.attributes?.address;
    if (addr) return String(addr);
    const ip = server.attributes?.ip;
    const port = server.attributes?.port;
    if (ip != null && port != null) return `${ip}:${port}`;
    return server.id;
}

interface GroupedServers {
    [categoryId: number]: {
        name: string;
        servers: EnhancedServerData[];
        categoryOrder: number;
    };
}

interface ServerListProps {
    serverTheme: Record<string, unknown>;
    initialRustalyzerEnabled?: boolean;
}

export default function ServerList({ serverTheme, initialRustalyzerEnabled = false }: ServerListProps) {
    const siteSettings = useSiteSettings();
    const { serverList: serverQueries, isLoading, isError } = useServerData();
    const { data: clientTheme } = useServerTheme();
    const theme = withServersDefaults(clientTheme || serverTheme);
    const rustalyzerEnabled = siteSettings.data?.rustalyzerEnabled ?? initialRustalyzerEnabled;

    if (siteSettings.isLoading || isLoading) {
        return (
            <div className="space-y-10 pt-6">
                {[1, 2].map((category) => (
                    <section key={category} className="space-y-4">
                        <div className="h-10 w-48 bg-white/5" />
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {[1, 2, 3].map((server) => (
                                <div key={server} className="h-[250px] border border-white/10 bg-white/[0.03]" />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        );
    }

    if (isError) {
        return <p className="pt-10 text-center text-sm text-[#e8a0a3]">Error loading servers. Please try again later.</p>;
    }

    const groupedServers = serverQueries.reduce<GroupedServers>((acc, query) => {
        if (query.data) {
            const { categoryId, categoryName, categoryOrder } = query.data;
            if (!acc[categoryId]) {
                acc[categoryId] = { name: categoryName, servers: [], categoryOrder };
            }
            acc[categoryId].servers.push(query.data);
        }
        return acc;
    }, {});

    const sortedCategories = Object.entries(groupedServers)
        .map(([categoryId, category]: [string, GroupedServers[number]]) => ({
            id: Number(categoryId),
            ...category,
            servers: [...category.servers].sort((a, b) => a.order - b.order),
        }))
        .sort((a, b) => a.categoryOrder - b.categoryOrder);

    const featuredId = serverQueries.reduce<string | null>((best, query) => {
        const server = query.data;
        if (!server) return best;
        if (!best) return server.id;
        const current = serverQueries.find((item) => item.data?.id === best)?.data;
        if (!current) return server.id;
        return (server.attributes.players || 0) > (current.attributes.players || 0) ? server.id : best;
    }, null);

    return (
        <div className="space-y-[15px] pt-6">
            {sortedCategories.map((category) => {
                const online = category.servers.reduce((sum: number, server: EnhancedServerData) => sum + (server.attributes.players || 0), 0);
                return (
                    <section key={category.id} className="pt-4">
                        <div className="pb-[15px]">
                            <p className="flex items-center gap-2 text-[9px] tracking-[3px]" style={{ color: theme.playerCountTextColor }}>
                                <span className="inline-block h-px w-6 bg-[#8b6c32]" />
                                {online} PLAYERS ONLINE
                            </p>
                            <h2
                                className="pt-1 text-[28px] font-extrabold leading-[42px] tracking-[-1.3px] text-[#eef4fb]"
                                style={{ color: theme.categoryTitleColor }}
                            >
                                {category.name.toUpperCase()}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {category.servers.map((server) =>
                                rustalyzerEnabled ? (
                                    <RustalyzerWidget key={server.id} serverId={getRustalyzerServerId(server)} />
                                ) : (
                                    <Server
                                        key={server.id}
                                        data={server}
                                        copyServerAddress={siteSettings.data?.copyServerAddress || false}
                                        categoryName={category.name}
                                        featured={server.id === featuredId}
                                    />
                                ),
                            )}
                        </div>
                    </section>
                );
            })}
            <p className="flex flex-wrap items-center gap-3.5 pt-8">
                <span className="text-[9px] tracking-[1px] text-[#ba9142]">
                    {theme.includeLabel || SERVERS_THEME_DEFAULTS.includeLabel}
                </span>
                <span className="text-[10px] leading-[10px] text-[rgba(159,184,207,0.56)]">
                    {theme.includeText || SERVERS_THEME_DEFAULTS.includeText}
                </span>
            </p>
        </div>
    );
}
