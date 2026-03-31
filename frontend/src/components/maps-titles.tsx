"use client";

import { useMapsTheme } from "@/hooks/use-maps-theme";

interface MapsTitlesProps {
    serverTheme?: any;
}

export function MapsTitles({ serverTheme }: MapsTitlesProps) {
    const { data: clientTheme } = useMapsTheme();
    
    const theme = clientTheme || serverTheme;

    return (
        <div className="flex flex-col items-center pb-8 text-center">
            <h2 
                className="mt-2 text-center text-4xl font-bold transition-colors duration-300"
                style={{
                    color: theme?.titleColor || "#ffffff"
                }}
            >
                Server Maps
            </h2>
            <div 
                className="max-w-[80ch] px-8 text-center leading-8 lg:px-0 transition-colors duration-300"
                style={{
                    color: theme?.subtitleColor || "#b0b0b0"
                }}
            >
                Browse and download maps from our servers. Find the perfect map for your next adventure!
            </div>
        </div>
    );
}
