"use client";

import { useSupportTheme } from "@/hooks/use-support-theme";
import { withUserDefaults } from "@/lib/user-theme-defaults";

interface SupportThemeProviderProps {
    children: React.ReactNode;
    serverTheme?: any;
}

export function SupportThemeProvider({ children, serverTheme }: SupportThemeProviderProps) {
    const { data: clientTheme } = useSupportTheme();
    
    const theme = withUserDefaults(clientTheme || serverTheme);
    
    return (
        <div 
            className="min-h-screen"
            style={{ 
                backgroundColor: theme?.backgroundColor ?? "transparent",
                backdropFilter: theme?.blurIntensity ? `blur(${theme.blurIntensity * 10}px)` : undefined,
                transition: "all 0.3s ease-in-out",
            }}
        >
            {children}
        </div>
    );
}
