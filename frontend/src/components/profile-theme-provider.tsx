"use client";

import { createContext, useContext } from "react";
import { useProfileTheme } from "@/hooks/use-profile-theme";
import { withUserDefaults } from "@/lib/user-theme-defaults";

interface ProfileThemeProviderProps {
    children: React.ReactNode;
    serverTheme?: Record<string, unknown>;
}

const ProfileThemeContext = createContext<ReturnType<typeof withUserDefaults> | null>(null);

export function ProfileThemeProvider({ children, serverTheme }: ProfileThemeProviderProps) {
    const { data: clientTheme } = useProfileTheme();
    const theme = withUserDefaults(
        typeof clientTheme === "object" && clientTheme !== null && !Array.isArray(clientTheme)
            ? clientTheme
            : serverTheme
    );

    return (
        <ProfileThemeContext.Provider value={theme}>
            {children}
        </ProfileThemeContext.Provider>
    );
}

export function useProfileThemeContext() {
    return useContext(ProfileThemeContext);
}
