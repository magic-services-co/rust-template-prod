"use client";

import { createContext, useContext } from "react";
import { useProfileTheme } from "@/hooks/use-profile-theme";
import { withUserDefaults } from "@/lib/user-theme-defaults";

interface ProfileThemeProviderProps {
    children: React.ReactNode;
    serverTheme?: any;
}

const ProfileThemeContext = createContext<any>(null);

export function ProfileThemeProvider({ children, serverTheme }: ProfileThemeProviderProps) {
    const { data: clientTheme } = useProfileTheme();
    const theme = withUserDefaults(
        typeof clientTheme === "object" && clientTheme !== null && !Array.isArray(clientTheme)
            ? clientTheme
            : serverTheme
    );

    const backgroundStyle = theme.backgroundColor && theme.backgroundColor !== "transparent" ? {
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundColor.includes("gradient") ? theme.backgroundColor : undefined,
    } : {};

    const blurStyle = theme.blurIntensity != null && Number.isFinite(theme.blurIntensity) ? {
        backdropFilter: `blur(${theme.blurIntensity * 10}px)`,
        WebkitBackdropFilter: `blur(${theme.blurIntensity * 10}px)`,
    } : {};

    return (
        <ProfileThemeContext.Provider value={theme}>
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
        </ProfileThemeContext.Provider>
    );
}

export function useProfileThemeContext() {
    return useContext(ProfileThemeContext);
}
