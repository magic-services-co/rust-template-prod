'use client'

import * as React from "react"
import { Check, Copy } from "lucide-react"
import Image from "next/image"
import { useOrders } from "@/hooks/store/use-storefront"
import { Order, OrderLine } from "@/types/store"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
    PROFILE_PAGE_SIZE,
    ProfileEmpty,
    ProfilePager,
    ProfilePanel,
    ProfileSearch,
    ProfileStatusTabs,
} from "@/components/profile/profile-ui"

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
    const [copied, setCopied] = React.useState(false)
    return (
        <button
            type="button"
            className="ghost support-form-meta h-7 w-7 p-0"
            aria-label="Copy order id"
            onClick={(event) => {
                event.stopPropagation()
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

function statusChip(status: string) {
    const value = status.toLowerCase()
    if (value === "completed") return { label: "COMPLETED", className: "ticket-chip-yes" }
    if (value === "canceled" || value === "cancelled") return { label: "CANCELED", className: "ticket-chip-no" }
    if (value === "chargeback") return { label: "CHARGEBACK", className: "ticket-chip-no" }
    return { label: value ? value.toUpperCase() : "UNKNOWN", className: "" }
}

function OrderCard({ order }: { order: Order }) {
    const [open, setOpen] = React.useState(false)
    const lines = Array.isArray(order.lines) ? order.lines : []
    const chip = statusChip(String(order.status ?? ""))
    const currencyPaid = order.presentment_currency ?? order.currency
    const amountStr = order.presentment_total_amount_str ?? order.total_amount_str
    const purchased = order.created_at ? new Date(String(order.created_at)).toDateString() : ""

    return (
        <ProfilePanel>
            <div className="relative p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="support-form-kicker text-[9px] font-bold tracking-[1.62px]">ORDER</p>
                        <div className="flex items-center gap-1 pt-1">
                            <h3 className="support-form-title truncate text-[16px] font-extrabold leading-6">
                                {String(order.id)}
                            </h3>
                            <CopyButton text={String(order.id)} />
                        </div>
                        <p className="support-form-help pt-1 text-[12px]">
                            {typeof amountStr === "string" ? amountStr : ""}{" "}
                            <span className="uppercase">{typeof currencyPaid === "string" ? currencyPaid : ""}</span>
                            {purchased ? ` · ${purchased}` : ""}
                        </p>
                    </div>
                    <span className={cn("ticket-chip shrink-0 self-start", chip.className)}>{chip.label}</span>
                </div>

                {lines.length > 0 ? (
                    <div className="pt-4">
                        <button
                            type="button"
                            className="ghost support-form-label"
                            onClick={() => setOpen((v) => !v)}
                        >
                            {open ? "HIDE ITEMS" : `SHOW ${lines.length} ITEM${lines.length === 1 ? "" : "S"}`}
                        </button>
                        {open ? (
                            <ul className="space-y-3 pt-3">
                                {lines.map((line: OrderLine, index) => (
                                    <li key={`${line.product_id ?? index}`} className="flex items-center gap-3">
                                        <Image
                                            src={typeof line?.product_image_url === "string" ? line.product_image_url : "/images/placeholder.png"}
                                            height={48}
                                            width={48}
                                            alt={line.product_name || "Product"}
                                            className="h-12 w-12 object-cover"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-medium" style={{ color: "#eef4fb" }}>
                                                {line.product_name || "Item"}
                                            </p>
                                            <p className="support-form-help text-[12px]">
                                                {typeof line.total_amount_str === "string" ? line.total_amount_str : ""}
                                                {line.quantity && Number(line.quantity) > 1 ? ` · ×${line.quantity}` : ""}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </ProfilePanel>
    )
}

interface TransactionsProps {
    serverTheme?: Record<string, unknown>
}

export default function Transactions({ serverTheme: _serverTheme }: TransactionsProps) {
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("all")
    const [page, setPage] = React.useState(1)
    const orderHistory = useOrders()

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        const rows: Order[] = orderHistory.isSuccess ? orderHistory.data ?? [] : []
        return rows.filter((order) => {
            const status = String(order.status ?? "").toLowerCase()
            if (statusFilter !== "all" && status !== statusFilter) return false
            if (!q) return true
            const names = (order.lines ?? []).map((line) => line.product_name ?? "").join(" ")
            return `${order.id} ${names} ${status}`.toLowerCase().includes(q)
        })
    }, [orderHistory.isSuccess, orderHistory.data, search, statusFilter])

    React.useEffect(() => {
        setPage(1)
    }, [search, statusFilter])

    const pageCount = Math.max(1, Math.ceil(filtered.length / PROFILE_PAGE_SIZE))
    const paged = filtered.slice((page - 1) * PROFILE_PAGE_SIZE, page * PROFILE_PAGE_SIZE)

    return (
        <div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <ProfileSearch value={search} onChange={setSearch} placeholder="Search orders…" className="md:max-w-sm" />
                <ProfileStatusTabs
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: "all", label: "ALL" },
                        { value: "completed", label: "COMPLETED" },
                        { value: "canceled", label: "CANCELED" },
                        { value: "chargeback", label: "CHARGEBACK" },
                    ]}
                />
            </div>

            <div className="space-y-3 pt-5">
                {orderHistory.isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-[108px] animate-pulse border"
                            style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(8,12,17,0.6)" }}
                        />
                    ))
                ) : paged.length === 0 ? (
                    <ProfileEmpty
                        kicker="STORE"
                        title={orderHistory.data && orderHistory.data.length > 0 ? "NO MATCHING ORDERS" : "NO ORDERS YET"}
                        body={orderHistory.data && orderHistory.data.length > 0
                            ? "Try a different search or status filter."
                            : "Purchases from the store will show up here."}
                        action={
                            <Link
                                href="/store"
                                className="ghost support-form-btn-primary inline-flex h-[41px] items-center px-5 text-[10px] font-bold tracking-[1.4px]"
                            >
                                OPEN STORE
                            </Link>
                        }
                    />
                ) : (
                    paged.map((order) => <OrderCard key={String(order.id)} order={order} />)
                )}
            </div>

            {!orderHistory.isLoading && filtered.length > 0 ? (
                <ProfilePager
                    page={page}
                    pageCount={pageCount}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
                    summary={`${filtered.length} order${filtered.length === 1 ? "" : "s"}`}
                />
            ) : null}
        </div>
    )
}
