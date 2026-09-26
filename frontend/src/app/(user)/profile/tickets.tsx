'use client'

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import Link from "next/link"
import { Ticket } from "@/types/tickets"
import { backendApi } from "@/lib/api"
import { getAuthToken } from "@/lib/laravel-auth"
import { cn } from "@/lib/utils"
import {
    PROFILE_PAGE_SIZE,
    ProfileEmpty,
    ProfilePager,
    ProfilePanel,
    ProfileSearch,
    ProfileStatusTabs,
    padTicketId,
} from "@/components/profile/profile-ui"

interface TicketsProps {
    serverTheme?: Record<string, unknown>
}

export default function Tickets({ serverTheme: _serverTheme }: TicketsProps) {
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("all")
    const [page, setPage] = React.useState(1)

    const { data: tickets, isLoading } = useQuery<Ticket[]>({
        queryKey: ['tickets'],
        queryFn: async () => {
            const token = getAuthToken()
            const headers: Record<string, string> = { Accept: 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(backendApi('tickets'), { credentials: 'include', headers })
            if (!res.ok) return []
            return res.json()
        },
    })

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        return (tickets ?? []).filter((ticket) => {
            const status = String(ticket.status ?? "").toLowerCase()
            if (statusFilter !== "all" && status !== statusFilter) return false
            if (!q) return true
            const hay = [
                String(ticket.id ?? ""),
                padTicketId(ticket.id),
                ticket.category?.name ?? "",
                status,
            ].join(" ").toLowerCase()
            return hay.includes(q)
        }).sort((a, b) => {
            const aTime = new Date(String(a.updatedAt ?? a.createdAt ?? 0)).getTime()
            const bTime = new Date(String(b.updatedAt ?? b.createdAt ?? 0)).getTime()
            return bTime - aTime
        })
    }, [tickets, search, statusFilter])

    React.useEffect(() => {
        setPage(1)
    }, [search, statusFilter])

    const pageCount = Math.max(1, Math.ceil(filtered.length / PROFILE_PAGE_SIZE))
    const paged = filtered.slice((page - 1) * PROFILE_PAGE_SIZE, page * PROFILE_PAGE_SIZE)

    return (
        <div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <ProfileSearch value={search} onChange={setSearch} placeholder="Search tickets…" className="md:max-w-sm" />
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <ProfileStatusTabs
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: "all", label: "ALL" },
                            { value: "open", label: "OPEN" },
                            { value: "closed", label: "CLOSED" },
                        ]}
                    />
                    <Link
                        href="/support"
                        className="ghost support-form-btn-primary flex h-[41px] items-center px-4 text-[10px] font-bold tracking-[1.4px]"
                    >
                        NEW TICKET
                    </Link>
                </div>
            </div>

            <div className="pt-5">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-[108px] animate-pulse border"
                                style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(8,12,17,0.6)" }}
                            />
                        ))}
                    </div>
                ) : paged.length === 0 ? (
                    <ProfileEmpty
                        kicker="SUPPORT"
                        title={tickets && tickets.length > 0 ? "NO MATCHING TICKETS" : "NO TICKETS YET"}
                        body={tickets && tickets.length > 0
                            ? "Try a different search or status filter."
                            : "Open a support ticket if you need help with a player, payment, or server issue."}
                        action={
                            <Link
                                href="/support"
                                className="ghost support-form-btn-primary inline-flex h-[41px] items-center px-5 text-[10px] font-bold tracking-[1.4px]"
                            >
                                OPEN SUPPORT
                            </Link>
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {paged.map((ticket) => {
                            const open = String(ticket.status ?? "").toLowerCase() === "open"
                            return (
                                <Link key={String(ticket.id)} href={`/ticket/${ticket.id}`} className="block">
                                    <ProfilePanel hover>
                                        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                            <div className="min-w-0">
                                                <p className="support-form-kicker text-[9px] font-bold tracking-[1.62px]">
                                                    TICKET {padTicketId(ticket.id)}
                                                </p>
                                                <h3 className="support-form-title truncate pt-1 text-[18px] font-extrabold leading-6">
                                                    {(ticket.category?.name || "Support").toUpperCase()}
                                                </h3>
                                                <p className="support-form-help pt-1 text-[12px]">
                                                    {ticket.updatedAt
                                                        ? `Updated ${format(new Date(ticket.updatedAt), "MMM d, yyyy h:mm a")}`
                                                        : ticket.createdAt
                                                            ? `Opened ${format(new Date(ticket.createdAt), "MMM d, yyyy")}`
                                                            : "Opened recently"}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-3">
                                                <span className={cn("ticket-chip", open ? "ticket-chip-yes" : "ticket-chip-no")}>
                                                    {open ? "OPEN" : "CLOSED"}
                                                </span>
                                                <span className="support-ticket-arrow support-form-kicker text-[18px] leading-none">
                                                    →
                                                </span>
                                            </div>
                                        </div>
                                    </ProfilePanel>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {!isLoading && filtered.length > 0 ? (
                <ProfilePager
                    page={page}
                    pageCount={pageCount}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
                    summary={`${filtered.length} ticket${filtered.length === 1 ? "" : "s"}`}
                />
            ) : null}
        </div>
    )
}
