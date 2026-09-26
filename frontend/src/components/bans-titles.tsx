"use client"

import { BANS_THEME_DEFAULTS, withBansDefaults } from "@/lib/bans-theme-defaults"
import { useBansTheme } from "./bans-theme-provider"

interface BansTitlesProps {
    serverTheme?: Record<string, unknown>
}

export function BansTitles({ serverTheme }: BansTitlesProps) {
    const contextTheme = useBansTheme()
    const theme = withBansDefaults(contextTheme || serverTheme)

    return (
        <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
            <div className="flex items-center justify-center gap-3">
                <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
                <p
                    data-theme-field="kickerLabel"
                    data-theme-label="Hero kicker"
                    className="support-hero-kicker font-mono text-[11px] font-medium leading-[11px] tracking-[2.6px]"
                >
                    {theme.kickerLabel || BANS_THEME_DEFAULTS.kickerLabel}
                </p>
                <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
            </div>
            <h1
                data-theme-field="pageTitle"
                data-theme-label="Hero title"
                className="support-hero-title pt-3.5 text-[40px] font-bold leading-[49px] tracking-[-2.25px] sm:text-[50px]"
            >
                {theme.pageTitle || BANS_THEME_DEFAULTS.pageTitle}
            </h1>
            <p
                data-theme-field="pageSubtitle"
                data-theme-label="Hero subtitle"
                className="support-hero-subtitle max-w-[555px] pt-2.5 text-[14px] leading-[22.4px]"
            >
                {theme.pageSubtitle || BANS_THEME_DEFAULTS.pageSubtitle}
            </p>
        </div>
    )
}
