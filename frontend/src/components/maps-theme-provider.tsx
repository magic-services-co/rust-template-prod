"use client";

import { createContext, useContext } from "react";
import { useMapsTheme } from "@/hooks/use-maps-theme";

interface MapsThemeProviderProps {
    children: React.ReactNode;
    serverTheme?: any;
}

const MapsThemeContext = createContext<any>(null);

export function MapsThemeProvider({ children, serverTheme }: MapsThemeProviderProps) {
    const { data: clientTheme } = useMapsTheme();
    
    const theme = clientTheme || serverTheme;

    const backgroundStyle = theme?.backgroundColor ? {
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundColor.includes('gradient') ? theme.backgroundColor : undefined,
    } : {};

    const blurStyle = theme?.blurIntensity ? {
        backdropFilter: `blur(${theme.blurIntensity * 10}px)`,
        WebkitBackdropFilter: `blur(${theme.blurIntensity * 10}px)`,
    } : {};

    return (
        <MapsThemeContext.Provider value={theme}>
            <div 
                className="min-h-screen transition-colors duration-300"
                style={backgroundStyle}
            >
                <div 
                    className="min-h-screen transition-all duration-300"
                    style={blurStyle}
                >
                    {children}
                </div>
            </div>
        </MapsThemeContext.Provider>
    );
}

export function useMapsThemeContext() {
    return useContext(MapsThemeContext);
}
