"use client";

import { useSupportTheme } from "@/hooks/use-support-theme";

interface SupportTitlesProps {
    serverTheme?: any;
    isSignedIn?: boolean;
}

export function SupportTitles({ serverTheme, isSignedIn }: SupportTitlesProps) {
    const { data: clientTheme } = useSupportTheme();
    
    const theme = clientTheme || serverTheme;

    return (
        <div className="flex flex-col items-center pb-8 text-center">
            <h2 
                className="mt-2 text-center text-4xl font-bold transition-colors duration-300"
                style={{ color: theme?.titleColor || '#ffffff' }}
            >
                Create A Ticket
            </h2>
            <p 
                className="max-w-[80ch] bg-transparent px-8 text-center leading-8 lg:px-0 transition-colors duration-300"
                style={{ color: theme?.subtitleColor || 'rgba(255, 255, 255, 0.7)' }}
            >
                {isSignedIn 
                    ? "Create a ticket to report a bug, request a feature, or ask a question."
                    : "Please sign in to create a ticket."}
            </p>
        </div>
    );
}
