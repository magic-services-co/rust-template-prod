"use client"

import { createContext, useContext, ReactNode } from 'react'
import { USER_THEME_DEFAULTS } from '@/lib/user-theme-defaults'

export interface BansTheme {
    titleTextColor?: string
    titleBackgroundColor?: string
    titleBorderColor?: string
    titleBorderRadius?: string
    
    cardBackground?: string
    cardBorder?: string
    cardBorderRadius?: string
    cardShadow?: string
    
    buttonPrimaryBackground?: string
    buttonPrimaryText?: string
    buttonPrimaryHover?: string
    buttonSecondaryBackground?: string
    buttonSecondaryText?: string
    buttonSecondaryBorder?: string
    buttonBorderRadius?: string
    
    badgeActiveBackground?: string
    badgeActiveText?: string
    badgeInactiveBackground?: string
    badgeInactiveText?: string
    badgeGlobalBackground?: string
    badgeGlobalText?: string
    badgeCategoryBackground?: string
    badgeCategoryText?: string
    badgeIndividualBackground?: string
    badgeIndividualText?: string
    
    textPrimaryColor?: string
    textSecondaryColor?: string
    textMutedColor?: string
    
    inputBackground?: string
    inputBorder?: string
    inputTextColor?: string
    inputPlaceholderColor?: string
    inputBorderRadius?: string
    
    searchBackground?: string
    searchBorder?: string
    searchBorderRadius?: string
}

interface BansThemeProviderProps {
    children: ReactNode
    serverTheme?: BansTheme
}

const BansThemeContext = createContext<BansTheme | undefined>(undefined)

export function BansThemeProvider({ children, serverTheme }: BansThemeProviderProps) {
    const theme = serverTheme !== undefined && serverTheme !== null
        ? ({ ...USER_THEME_DEFAULTS, ...serverTheme } as BansTheme & typeof USER_THEME_DEFAULTS)
        : (USER_THEME_DEFAULTS as unknown as BansTheme);
    return (
        <BansThemeContext.Provider value={theme}>
            {children}
        </BansThemeContext.Provider>
    )
}

export function useBansTheme() {
    const context = useContext(BansThemeContext)
    return context
}
