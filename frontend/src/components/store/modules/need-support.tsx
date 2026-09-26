"use client";

import Link from "next/link";
import { withStoreDefaults } from "@/lib/layout-theme-defaults";
import { HomeCardCorners } from "@/components/home/home-card-corners";

export default function NeedSupport({ theme }: { theme?: any }) {
    const t = withStoreDefaults(theme);

    return (
        <div
            className="relative flex w-full flex-col overflow-visible border p-5"
            style={{
                borderColor: t.sidebarBorder,
                backgroundImage:
                    "linear-gradient(154deg, rgba(43, 110, 228, 0.16) 0%, rgba(10, 14, 20, 0.9) 100%)",
                ["--store-help-title" as string]: t.helpTitleColor,
                ["--store-help-body" as string]: t.helpBodyColor,
                ["--store-help-cta" as string]: t.buttonPrimaryText,
            }}
        >
            <p className="store-help-title text-[12px] font-bold leading-4">{t.helpTitle}</p>
            <p className="store-help-body pt-2 text-[11px] leading-5">{t.helpBody}</p>
            <Link
                href="/support"
                className="store-help-cta mt-4 inline-flex text-[9px] font-bold tracking-[1.35px]"
            >
                {t.helpCta}
            </Link>
            <HomeCardCorners color="#ba9142" show />
        </div>
    );
}
