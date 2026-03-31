import DynamicBreadcrumbs from "@/components/dynamic-breadcrumbs";
import { BansList } from "@/components/bans/bans-list";
import { BansThemeProvider, type BansTheme } from "@/components/bans-theme-provider";
import { BansTitles } from "@/components/bans-titles";
import { Suspense } from "react";
import { getMetadata } from "@/lib/metadata";
import { backendApi } from "@/lib/api";

export async function generateMetadata() {
  return await getMetadata('bans');
}

export default async function BansPage() {
    const res = await fetch(backendApi("data?include=pageTheme:bans"), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const pageTheme = data.pageTheme;

    if (!pageTheme || !(pageTheme as { enabled?: boolean }).enabled) {
        return (
            <div className="container pt-40">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-foreground mb-4">Page Disabled</h1>
                    <p className="text-muted-foreground text-lg">This page is currently disabled by an administrator.</p>
                </div>
            </div>
        );
    }

    const rawSettings = pageTheme && "settings" in pageTheme ? pageTheme.settings : null;
    const settings = typeof rawSettings === "string" ? (() => { try { return JSON.parse(rawSettings); } catch { return {}; } })() : rawSettings;
    const theme: BansTheme | undefined = settings && typeof settings === "object" ? (settings as { bans?: BansTheme }).bans : undefined;

    return (
        <BansThemeProvider serverTheme={theme}>
            <div className="container pt-40">
                <BansTitles serverTheme={theme} />
                <div className="pb-5">
                    <Suspense>
                        <DynamicBreadcrumbs />
                    </Suspense>
                </div>
                <Suspense>
                    <BansList />
                </Suspense>
            </div>
        </BansThemeProvider>
    )
}
