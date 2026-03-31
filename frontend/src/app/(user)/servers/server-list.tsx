"use client";

import Server from "@/components/server";
import { RustalyzerWidget } from "@/components/rustalyzer-widget";
import useServerData, { EnhancedServerData } from "@/hooks/use-server-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteSettings } from "@/hooks/use-site-settings";
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
    serverTheme: any;
    initialRustalyzerEnabled?: boolean;
}

export default function ServerList({ serverTheme, initialRustalyzerEnabled = false }: ServerListProps) {
    const siteSettings = useSiteSettings();
    const { serverList: serverQueries, isLoading, isError } = useServerData();
    const { data: clientTheme } = useServerTheme();
    
    const theme = clientTheme || serverTheme;
    const rustalyzerEnabled = siteSettings.data?.rustalyzerEnabled ?? initialRustalyzerEnabled;

    if (siteSettings.isLoading || isLoading) {
        return <ServerSkeleton />;
    }

    if (isError) {
        return <div>Error loading servers. Please try again later.</div>;
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
        .map(([categoryId, category]) => ({
            id: Number(categoryId),
            ...category,
            servers: category.servers.sort((a: EnhancedServerData, b: EnhancedServerData) => a.order - b.order),
        }))
        .sort((a, b) => a.categoryOrder - b.categoryOrder);

    return (
        <div 
            className="space-y-8"
            style={{ gap: theme?.spacing || '2rem' }}
        >
            {sortedCategories.map((category) => (
                <CategorySection
                    key={category.id}
                    categoryName={category.name}
                    servers={category.servers}
                    rustalyzerEnabled={rustalyzerEnabled}
                    copyServerAddress={siteSettings.data?.copyServerAddress || false}
                    serverTheme={theme}
                />
            ))}
        </div>
    );
}

interface CategorySectionProps {
    categoryName: string;
    servers: EnhancedServerData[];
    rustalyzerEnabled: boolean;
    copyServerAddress: boolean;
    serverTheme: any;
}

function CategorySection({ categoryName, servers, rustalyzerEnabled, copyServerAddress, serverTheme }: CategorySectionProps) {
  const { data: clientTheme } = useServerTheme();
  const theme = (clientTheme || serverTheme) as Record<string, unknown> | undefined;

  const titleColor = (theme?.titleTextColor ?? theme?.categoryTitleColor ?? "#ffffff") as string;
  const gap = (theme?.spacing as string | undefined) || "1rem";

  return (
    <section className="rounded-lg border border-border bg-transparent p-3 sm:p-4 md:p-5">
      <h2
        className="mb-4 text-lg font-semibold tracking-tight md:text-xl"
        style={{
          color: titleColor,
          fontSize: (theme?.categoryTitleSize as string | undefined) || undefined,
          marginBottom: gap,
        }}
      >
        {categoryName}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" style={{ gap }}>
        {servers.map((server) =>
          rustalyzerEnabled ? (
            <RustalyzerWidget key={server.id} serverId={getRustalyzerServerId(server)} />
          ) : (
                    <Server
                        key={server.id}
                        data={server}
                        copyServerAddress={copyServerAddress}
                        serverTheme={theme}
                        categoryName={categoryName}
                    />
          ),
        )}
      </div>
    </section>
  );
}

function ServerSkeleton() {
    return (
        <div className="space-y-8">
            {[1, 2].map((category) => (
                <section key={category}>
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((server) => (
                            <Skeleton key={server} className="h-40 w-full" />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}