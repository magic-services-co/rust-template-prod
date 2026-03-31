"use client"

import { useBansTheme } from "./bans-theme-provider"

interface BansTitlesProps {
    serverTheme?: any
}

export function BansTitles({ serverTheme }: BansTitlesProps) {
    const theme = useBansTheme() || serverTheme

    return (
        <div className="flex flex-col items-center pb-8 text-center">
            <h1 
                className="mt-2 text-center text-4xl font-bold"
                style={{ 
                    color: theme?.titleTextColor ?? "#f2f4f6",
                    backgroundColor: theme?.titleBackgroundColor ?? "transparent",
                    border: theme?.titleBorderColor ? `1px solid ${theme.titleBorderColor}` : "none",
                    borderRadius: theme?.titleBorderRadius ?? "0.5rem",
                    padding: theme?.titleBorderColor ? "1rem" : "0"
                }}
            >
                Ban List
            </h1>
            <p 
                className="max-w-[80ch] px-8 text-center leading-8 lg:px-0 mt-4"
                style={{ color: theme?.textSecondaryColor ?? "#9ca3af" }}
            >
                View all bans and their details
            </p>
        </div>
    )
}
