"use client"

import { createContext, useContext, ReactNode } from "react"
import { withBansDefaults, type BansTheme } from "@/lib/bans-theme-defaults"
import { usePageThemeDraft } from "@/hooks/use-page-theme-draft"

interface BansThemeProviderProps {
    children: ReactNode
    serverTheme?: Record<string, unknown>
}

const BansThemeContext = createContext<BansTheme | null>(null)

export function BansThemeProvider({ children, serverTheme }: BansThemeProviderProps) {
    const draft = usePageThemeDraft("bans")
    const theme = withBansDefaults(draft ?? serverTheme)
    return (
        <BansThemeContext.Provider value={theme}>
            {children}
        </BansThemeContext.Provider>
    )
}

export function useBansTheme() {
    return useContext(BansThemeContext)
}

export type { BansTheme }
