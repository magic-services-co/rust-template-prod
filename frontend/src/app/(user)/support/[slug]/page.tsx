import DynamicBreadcrumbs from "@/components/dynamic-breadcrumbs";
import { DynamicTicketForm } from "@/components/support/dynamic-ticket-form";
import { getMetadata } from "@/lib/metadata";
import { getServerSession } from "@/lib/get-server-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { backendApi } from "@/lib/api";
import { SupportThemeProvider } from "@/components/support-theme-provider";
import { SupportTitles } from "@/components/support-titles";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    return await getMetadata(`support/${slug}`);
};

export default async function SupportCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const session = await getServerSession()

    if (!session) {
        return redirect("/link")
    }

    const res = await fetch(backendApi("data?include=themeSettings,pageTheme:support"), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const themeSettings = data.themeSettings;
    const pageTheme = data.pageTheme;

    const rawSettings = pageTheme && "settings" in pageTheme ? pageTheme.settings : null;
    const settings = typeof rawSettings === "string" ? (() => { try { return JSON.parse(rawSettings); } catch { return {}; } })() : rawSettings;
    const theme = settings && typeof settings === "object" ? settings.support : undefined;

    return (
        <SupportThemeProvider serverTheme={theme}>
            <div className="container pt-40">
                <SupportTitles serverTheme={theme} />
                <div className="pb-5">
                    <Suspense>
                        <DynamicBreadcrumbs />
                    </Suspense>
                </div>
                <DynamicTicketForm
                    categorySlug={slug}
                    serverTheme={theme}
                />
            </div>
        </SupportThemeProvider>
    )
}