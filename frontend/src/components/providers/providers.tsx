'use client'

import { SessionProvider } from "@/lib/laravel-auth-react"
import { ThemeProvider } from "./theme-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react"
import { Toaster } from "../ui/sonner";
import { useAuthEvents } from "@/hooks/use-auth-events";
import { CookieConsentProvider } from "./cookie-consent-provider";
import { LiveSiteEditor } from "@/components/theme/live-site-editor";

export function Providers({ children }: { children: React.ReactNode }) {
    const [client] = useState(new QueryClient())
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <QueryClientProvider client={client}>
                <SessionProvider>
                    <CookieConsentProvider>
                        <AuthEventWrapper>
                            {children ?? null}
                            <LiveSiteEditor />
                            <Toaster />
                            <ReactQueryDevtools initialIsOpen={false} />
                        </AuthEventWrapper>
                    </CookieConsentProvider>
                </SessionProvider>
            </QueryClientProvider>
        </ThemeProvider>
    )
}

function AuthEventWrapper({ children }: { children: React.ReactNode }) {
    useAuthEvents();
    return children ?? null;
}