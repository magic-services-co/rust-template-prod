"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Check, Copy, Clock, Globe, FolderOpen, Server, Ban } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    ProfileEmpty,
    ProfilePager,
    ProfilePanel,
    ProfileSearch,
    ProfileStatusTabs,
} from "@/components/profile/profile-ui"

interface Ban {
    id: string
    userId: string
    reason: string
    banType: "GLOBAL" | "CATEGORY" | "INDIVIDUAL"
    serverId?: string
    categoryId?: number
    expiresAt?: string | null
    isActive: boolean
    createdAt: string
    user?: {
        id?: string
        name?: string | null
        email?: string | null
        image?: string | null
    } | null
    admin?: {
        id?: string
        name?: string | null
        email?: string | null
    } | null
}

async function copyToClipboard(value: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(value)
            return true
        } catch {
            /* fall through */
        }
    }
    try {
        const ta = document.createElement("textarea")
        ta.value = value
        ta.setAttribute("readonly", "")
        ta.style.position = "fixed"
        ta.style.left = "-9999px"
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(ta)
        return ok
    } catch {
        return false
    }
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <button
            type="button"
            className="ghost support-form-meta h-7 w-7 p-0"
            aria-label="Copy"
            onClick={() => {
                void copyToClipboard(text).then((ok) => {
                    if (!ok) return
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                })
            }}
        >
            {copied ? <Check className="h-3.5 w-3.5 ticket-status-open" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    )
}

function isSteamId(value?: string | null) {
    return !!value && /^\d{17}$/.test(value)
}

function playerName(ban: Ban) {
    return ban.user?.name || (isSteamId(ban.userId) ? "STEAM PLAYER" : "UNKNOWN PLAYER")
}

function typeLabel(type: string) {
    switch (type) {
        case "GLOBAL":
            return "ALL SERVERS"
        case "CATEGORY":
            return "CATEGORY"
        case "INDIVIDUAL":
            return "SERVER"
        default:
            return type
    }
}

function typeIcon(type: string) {
    const className = "h-3.5 w-3.5"
    switch (type) {
        case "GLOBAL":
            return <Globe className={className} />
        case "CATEGORY":
            return <FolderOpen className={className} />
        case "INDIVIDUAL":
            return <Server className={className} />
        default:
            return <Ban className={className} />
    }
}

function isExpired(expiresAt?: string | null) {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
}

const PAGE_SIZE = 12

export function BansList() {
    const [bans, setBans] = useState<Ban[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [banTypeFilter, setBanTypeFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalBans, setTotalBans] = useState(0)

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchTerm.trim())
            setPage(1)
        }, 400)
        return () => window.clearTimeout(timer)
    }, [searchTerm])

    const fetchBans = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: String(PAGE_SIZE),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(banTypeFilter !== "all" && { banType: banTypeFilter }),
                ...(statusFilter !== "all" && { isActive: statusFilter === "active" ? "true" : "false" }),
            })

            const response = await fetch(`/api/bans?${params}`)
            if (response.ok) {
                const data = await response.json()
                setBans(data.bans || [])
                const total = Number(data.total) || 0
                setTotalBans(total)
                setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)))
            } else {
                toast.error("Failed to fetch bans")
            }
        } catch (error) {
            console.error("Error fetching bans:", error)
            toast.error("Failed to fetch bans")
        } finally {
            setLoading(false)
        }
    }, [page, debouncedSearch, banTypeFilter, statusFilter])

    useEffect(() => {
        fetchBans()
    }, [fetchBans])

    return (
        <div>
            <div className="flex w-full min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1">
                    <ProfileSearch
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search name, Steam ID, or reason…"
                        className="h-[42px] w-full"
                    />
                </div>
                <ProfileStatusTabs
                    className="w-fit shrink-0"
                    value={statusFilter}
                    onChange={(value) => {
                        setStatusFilter(value)
                        setPage(1)
                    }}
                    options={[
                        { value: "all", label: "ALL" },
                        { value: "active", label: "ACTIVE" },
                        { value: "inactive", label: "INACTIVE" },
                    ]}
                />
                <ProfileStatusTabs
                    className="w-fit shrink-0"
                    value={banTypeFilter}
                    onChange={(value) => {
                        setBanTypeFilter(value)
                        setPage(1)
                    }}
                    options={[
                        { value: "all", label: "ALL TYPES" },
                        { value: "GLOBAL", label: "GLOBAL" },
                        { value: "CATEGORY", label: "CATEGORY" },
                        { value: "INDIVIDUAL", label: "SERVER" },
                    ]}
                />
            </div>

            <div className="space-y-3 pt-6">
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-[148px] animate-pulse border"
                            style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(8,12,17,0.6)" }}
                        />
                    ))
                ) : bans.length === 0 ? (
                    <ProfileEmpty
                        kicker="BANS"
                        title={debouncedSearch || banTypeFilter !== "all" || statusFilter !== "all" ? "NO MATCHING BANS" : "NO BANS"}
                        body={
                            debouncedSearch || banTypeFilter !== "all" || statusFilter !== "all"
                                ? "Try a different search or filter."
                                : "There are no bans to display."
                        }
                    />
                ) : (
                    bans.map((ban) => {
                        const expired = isExpired(ban.expiresAt)
                        const steamId = isSteamId(ban.userId) ? ban.userId : null
                        const avatar = ban.user?.image || ""
                        const name = playerName(ban)
                        return (
                            <ProfilePanel key={ban.id} hover>
                                <div className="relative p-5 sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex min-w-0 items-start gap-4">
                                            <div
                                                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border text-[18px] font-bold"
                                                style={{ borderColor: "rgba(255,255,255,0.1)", color: "#eef4fb" }}
                                            >
                                                {avatar ? (
                                                    <Image
                                                        src={avatar}
                                                        alt={name}
                                                        width={56}
                                                        height={56}
                                                        className="h-14 w-14 object-cover"
                                                    />
                                                ) : (
                                                    name.slice(0, 1).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="support-form-kicker text-[9px] font-bold tracking-[1.62px]">
                                                    PLAYER
                                                </p>
                                                {steamId ? (
                                                    <a
                                                        href={`https://steamcommunity.com/profiles/${steamId}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="support-form-title mt-1 block truncate text-[18px] font-extrabold leading-6 hover:underline"
                                                    >
                                                        {name.toUpperCase()}
                                                    </a>
                                                ) : (
                                                    <h3 className="support-form-title truncate pt-1 text-[18px] font-extrabold leading-6">
                                                        {name.toUpperCase()}
                                                    </h3>
                                                )}
                                                {steamId ? (
                                                    <div className="flex items-center gap-1 pt-1">
                                                        <p className="truncate font-mono text-[12px] support-form-help">
                                                            {steamId}
                                                        </p>
                                                        <CopyButton text={steamId} />
                                                    </div>
                                                ) : ban.user?.email ? (
                                                    <p className="support-form-help truncate pt-1 text-[12px]">
                                                        {ban.user.email}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                                            <span className="ticket-chip">
                                                {typeIcon(ban.banType)}
                                                <span className="ml-1.5">{typeLabel(ban.banType)}</span>
                                            </span>
                                            <span
                                                className={cn(
                                                    "ticket-chip",
                                                    expired ? "" : ban.isActive ? "ticket-chip-no" : "",
                                                )}
                                            >
                                                {expired ? "EXPIRED" : ban.isActive ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="support-form-help pt-4 text-[13px] leading-5">
                                        {ban.reason || "No reason provided."}
                                    </p>

                                    <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4">
                                        <div>
                                            <p className="support-form-label">Issued</p>
                                            <p className="flex items-center gap-1.5 pt-1 text-[12px]" style={{ color: "#eef4fb" }}>
                                                <Clock className="h-3 w-3" />
                                                {ban.createdAt ? format(new Date(ban.createdAt), "MMM d, yyyy") : "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="support-form-label">By</p>
                                            <p className="pt-1 text-[12px]" style={{ color: "#eef4fb" }}>
                                                {ban.admin?.name || "Staff"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="support-form-label">Expires</p>
                                            <p className="pt-1 text-[12px]" style={{ color: "#eef4fb" }}>
                                                {!ban.expiresAt
                                                    ? "Permanent"
                                                    : expired
                                                        ? "Expired"
                                                        : format(new Date(ban.expiresAt), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        {ban.serverId ? (
                                            <div>
                                                <p className="support-form-label">Server</p>
                                                <p className="pt-1 font-mono text-[12px]" style={{ color: "#eef4fb" }}>
                                                    {ban.serverId}
                                                </p>
                                            </div>
                                        ) : null}
                                        {ban.categoryId != null ? (
                                            <div>
                                                <p className="support-form-label">Category</p>
                                                <p className="pt-1 font-mono text-[12px]" style={{ color: "#eef4fb" }}>
                                                    {ban.categoryId}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </ProfilePanel>
                        )
                    })
                )}
            </div>

            {!loading && totalBans > 0 ? (
                <ProfilePager
                    page={page}
                    pageCount={totalPages}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                    summary={`${totalBans} ban${totalBans === 1 ? "" : "s"}`}
                />
            ) : null}
        </div>
    )
}
