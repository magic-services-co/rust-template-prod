"use client"

import { useEffect } from "react"
import { logAdminAction } from "@/lib/admin-log"

const LOGS_PATH = "/api/admin/logs/"

export function AdminActionLogger() {
    useEffect(() => {
        const originalFetch = window.fetch
        window.fetch = async (
            input: RequestInfo | URL,
            init?: RequestInit
        ): Promise<Response> => {
            const response = await originalFetch(input, init)
            const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url
            let path: string
            try {
                path = new URL(url, window.location.origin).pathname
            } catch {
                path = url
            }
            const method = (init?.method ?? (input as Request)?.method ?? "GET").toUpperCase()

            if (
                path.startsWith("/api/admin/") &&
                !path.startsWith(LOGS_PATH) &&
                ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
                response.ok
            ) {
                const action = `${method} ${path}`
                logAdminAction(action, { path, method }).catch(() => {})
            }
            return response
        }
        return () => {
            window.fetch = originalFetch
        }
    }, [])

    return null
}
