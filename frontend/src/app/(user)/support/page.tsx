import DynamicBreadcrumbs from "@/components/dynamic-breadcrumbs";
import TicketCategories from "@/components/support/ticket-categories";
import { buttonVariants } from "@/components/ui/button";
import { getMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "@/lib/get-server-session";
import { backendApi } from "@/lib/api";
import { SupportThemeProvider } from "@/components/support-theme-provider";
import { SupportTitles } from "@/components/support-titles";

export async function generateMetadata() {
  return await getMetadata('support');
}

export default async function SupportPage() {
    const session = await getServerSession();
    const isSignedIn = !!session;
    const res = await fetch(backendApi("data?include=themeSettings,pageTheme:support"), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const data = res.ok ? await res.json() : {};
    const themeSettings = data.themeSettings;
    const pageTheme = data.pageTheme;

    const rawSettings = pageTheme && "settings" in pageTheme ? pageTheme.settings : null;
    let settings = typeof rawSettings === "string" ? (() => { try { return JSON.parse(rawSettings); } catch { return {}; } })() : rawSettings;
    const theme = settings && typeof settings === "object" ? settings.support : undefined;

    const user = session?.user as { isBanned?: boolean; banReason?: string | null } | undefined;
    const isBanned = isSignedIn && user?.isBanned === true;
    const banReason = isSignedIn ? (user?.banReason ?? null) : null;

    if (isSignedIn && isBanned) {
        return (
            <SupportThemeProvider serverTheme={theme}>
                <div className="container pt-40">
                    <div className="flex flex-col items-center pb-8 text-center">
                        <h2 
                            className="mt-2 text-center text-4xl font-bold"
                            style={{ color: theme?.banMessageTextColor || "#ef4444" }}
                        >
                            Account Banned
                        </h2>
                        <div 
                            className="max-w-[80ch] px-8 text-center leading-8 lg:px-0 mt-4 p-4 rounded-lg border"
                            style={{
                                backgroundColor: theme?.banMessageBackground || "rgba(239, 68, 68, 0.1)",
                                border: `1px solid ${theme?.banMessageBorder || "#ef4444"}`,
                                borderRadius: theme?.cardBorderRadius || "0.5rem"
                            }}
                        >
                            <p style={{ color: theme?.banMessageTextColor || "#ef4444" }}>
                                Your account has been banned from creating tickets.
                                {banReason && (
                                    <span className="block mt-2 font-semibold">
                                        Reason: {banReason}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </SupportThemeProvider>
        );
    }

    return (
        <SupportThemeProvider serverTheme={theme}>
            <div className="container pt-40">
                <SupportTitles serverTheme={theme} />
                <div className="pb-5 flex items-center justify-between">
                    <Suspense>
                        <DynamicBreadcrumbs />
                    </Suspense>
                    {isSignedIn && (
                        <Link
                            href="/profile?tab=tickets"
                            className={cn(
                                buttonVariants({
                                    variant: "ghost",
                                }),
                                "text-base hover:opacity-80 transition-opacity"
                            )}
                            style={{
                                backgroundColor: theme?.buttonSecondaryBackground || "transparent",
                                color: theme?.buttonSecondaryText || "#9ca3af",
                                border: `1px solid ${theme?.buttonSecondaryBorder || "#374151"}`,
                                borderRadius: theme?.buttonBorderRadius || "0.375rem"
                            }}
                        >
                            View My Tickets
                        </Link>
                    )}
                </div>
                <TicketCategories isSignedIn={isSignedIn} serverTheme={theme} />
            </div>
        </SupportThemeProvider>
    );
}