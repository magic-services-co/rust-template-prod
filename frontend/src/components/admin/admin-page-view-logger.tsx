"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

export function AdminPageViewLogger() {
    const pathname = usePathname()
    const previousPath = useRef<string | null>(null)

    useEffect(() => {
        if (!pathname || !pathname.startsWith("/admin")) return
        if (previousPath.current === pathname) return
        previousPath.current = pathname

        fetch("/api/admin/logs/page-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ path: pathname }),
        }).catch(() => {})
    }, [pathname])

    return null
}
