"use client"

import { RustmapsGenerationProvider } from "@/components/admin/map-voting/rustmaps-generation-context"
import type { ReactNode } from "react"

export function MapVotingClientShell({ children }: { children: ReactNode }) {
    return <RustmapsGenerationProvider>{children}</RustmapsGenerationProvider>
}
