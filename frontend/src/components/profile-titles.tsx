"use client";

import { useProfileTheme } from "@/hooks/use-profile-theme";

interface ProfileTitlesProps {
    serverTheme?: any;
    userName?: string | null;
}

export function ProfileTitles({ serverTheme, userName }: ProfileTitlesProps) {
    const { data: clientTheme } = useProfileTheme();
    
    const theme = clientTheme || serverTheme;

    return (
        <div className="flex flex-col items-center pb-8 text-center">
            <h2 
                className="mt-2 text-center text-4xl font-bold transition-colors duration-300"
                style={{
                    color: theme?.titleColor || "#ffffff"
                }}
            >
                {userName ? `${userName}'s Profile` : 'User Profile'}
            </h2>
            <div 
                className="max-w-[80ch] px-8 text-center leading-8 lg:px-0 transition-colors duration-300"
                style={{
                    color: theme?.subtitleColor || "#b0b0b0"
                }}
            >
                Manage your account settings, view your activity, and customize your experience.
            </div>
        </div>
    );
}
