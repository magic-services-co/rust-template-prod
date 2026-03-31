"use client"

import { backendApi } from "@/lib/api"
import { getAuthToken } from "@/lib/laravel-auth"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Settings } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type MapVotingConfig = {
    isRustMapsApiConfigured?: boolean
    rustmapsOrgId?: string | null
    rustmapsCustomGenerationEnabled?: boolean
    isLocalCdnConfigured?: boolean
}

export function RustMapsSettingsDialog({ className }: { className?: string }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [apiKeyInput, setApiKeyInput] = useState("")
    const [orgIdInput, setOrgIdInput] = useState("")

    const { data: config, isLoading } = useQuery({
        queryKey: ["mapVotingConfig"],
        queryFn: async () => {
            const token = getAuthToken()
            const headers: Record<string, string> = { Accept: "application/json" }
            if (token) headers["Authorization"] = `Bearer ${token}`
            const response = await fetch(backendApi("admin/map-voting/config"), {
                credentials: "include",
                headers,
            })
            if (!response.ok) throw new Error("Failed to load map voting config")
            return response.json() as Promise<MapVotingConfig>
        },
    })

    useEffect(() => {
        if (!open) return
        setApiKeyInput("")
    }, [open])

    useEffect(() => {
        if (!open || isLoading) return
        setOrgIdInput(config?.rustmapsOrgId?.trim() ?? "")
    }, [open, isLoading, config?.rustmapsOrgId])

    const mutation = useMutation({
        mutationFn: async (payload: { apiKey: string; orgId: string }) => {
            const token = getAuthToken()
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
            if (token) headers["Authorization"] = `Bearer ${token}`
            const response = await fetch(backendApi("admin/map-voting/rustmaps-api-key"), {
                method: "PATCH",
                credentials: "include",
                headers,
                body: JSON.stringify({ apiKey: payload.apiKey, orgId: payload.orgId }),
            })
            if (!response.ok) {
                const err = await response.json().catch(() => null)
                throw new Error(
                    (err && typeof err === "object" && "message" in err && typeof err.message === "string"
                        ? err.message
                        : null) || "Failed to save RustMaps settings"
                )
            }
            return response.json()
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["mapVotingConfig"] })
            setApiKeyInput("")
            toast.success("RustMaps settings saved")
        },
        onError: (e: Error) => {
            toast.error(e.message)
        },
    })

    const configured = config?.isRustMapsApiConfigured === true

    return (
        <div className={cn("relative inline-flex shrink-0", className)}>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="relative" aria-label="RustMaps API settings">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">RustMaps API settings</span>
                        {!isLoading && !configured ? (
                            <span
                                className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background"
                                aria-hidden
                            />
                        ) : null}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>RustMaps integration</DialogTitle>
                        <DialogDescription>
                            API key and optional organization ID for resolving RustMaps links when creating votes. Create or manage keys on{" "}
                            <Link
                                href="https://rustmaps.com/dashboard"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline-offset-4 hover:underline"
                            >
                                rustmaps.com/dashboard
                            </Link>
                            . When set, the organization ID is sent as the RustMaps x-org-id header on map lookups.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="rustmaps-org-id">Organization ID</Label>
                            <Input
                                id="rustmaps-org-id"
                                autoComplete="off"
                                placeholder="Optional"
                                value={orgIdInput}
                                onChange={(e) => setOrgIdInput(e.target.value)}
                                disabled={mutation.isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rustmaps-api-key">API key</Label>
                            <Input
                                id="rustmaps-api-key"
                                type="password"
                                autoComplete="off"
                                placeholder={configured ? "Paste a new key to replace" : "Required for RustMaps link resolution"}
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                disabled={mutation.isPending}
                            />
                            <p className="text-sm text-muted-foreground">
                                Stored encrypted; never shown again after saving. Leave empty and save to remove the key (organization ID
                                is saved as entered).
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setOpen(false)}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ apiKey: apiKeyInput, orgId: orgIdInput })}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving…
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
