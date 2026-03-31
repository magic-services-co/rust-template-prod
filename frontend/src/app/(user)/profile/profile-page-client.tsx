"use client";

import ProfileHeader from "./profile-header";
import DynamicBreadcrumbs from "@/components/dynamic-breadcrumbs";
import { Suspense } from "react";
import { ProfileTabs } from "./profile-tabs";
import { ProfileThemeProvider } from "@/components/profile-theme-provider";
import { ProfileTitles } from "@/components/profile-titles";
import type { UserSession } from "@/types/next-auth";

type ProfilePageClientProps = {
    user: UserSession;
    theme: Record<string, unknown> | undefined;
};

export function ProfilePageClient({ user, theme }: ProfilePageClientProps) {
    return (
        <ProfileThemeProvider serverTheme={theme}>
            <div className="container pt-40">
                <ProfileTitles serverTheme={theme} userName={user?.name ?? undefined} />
                <div className="pb-5">
                    <Suspense>
                        <DynamicBreadcrumbs />
                    </Suspense>
                </div>
                <ProfileHeader user={user} serverTheme={theme} />
                <Suspense>
                    <ProfileTabs user={user} serverTheme={theme} />
                </Suspense>
            </div>
        </ProfileThemeProvider>
    );
}
