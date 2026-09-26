'use client'

import * as React from "react"
import { Check, Copy } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCancelSubscriptionMutation, useSubscriptions } from "@/hooks/store/use-storefront"
import { Subscription } from "@/types/store"
import { cn } from "@/lib/utils"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"
import {
    PROFILE_PAGE_SIZE,
    ProfileEmpty,
    ProfilePager,
    ProfilePanel,
    ProfileSearch,
    ProfileStatusTabs,
} from "@/components/profile/profile-ui"

type ProfileSubscriptionsTheme = ReturnType<typeof withUserDefaults>

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
            aria-label="Copy subscription id"
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

function CancelButton({
    id,
    status,
    theme,
}: {
    id: string
    status: string
    theme: ProfileSubscriptionsTheme
}) {
    const { mutate, isPending } = useCancelSubscriptionMutation()
    const [isOpen, setIsOpen] = React.useState(false)
    const canceled = status === "canceled" || status === "cancelled"

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    disabled={isPending || canceled}
                    className="ghost support-form-btn-secondary h-[41px] px-4 text-[10px] font-bold tracking-[1.4px] disabled:opacity-40"
                    style={{ color: theme.buttonDestructiveText, borderColor: "rgba(232, 160, 163, 0.35)" }}
                >
                    {isPending ? "CANCELING…" : canceled ? "CANCELED" : "CANCEL"}
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent
                className="z-[200] rounded-none border"
                style={{
                    backgroundColor: theme.contentCardBackground,
                    borderColor: theme.contentCardBorder,
                }}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle className="support-form-title">Cancel subscription</AlertDialogTitle>
                    <AlertDialogDescription className="support-form-help">
                        Are you sure you want to cancel this subscription? This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="ghost support-form-btn-secondary h-[41px] rounded-none px-4 text-[10px] font-bold tracking-[1.4px]">
                        KEEP
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            mutate(id)
                            setIsOpen(false)
                        }}
                        className="ghost support-form-btn-primary h-[41px] rounded-none px-4 text-[10px] font-bold tracking-[1.4px]"
                        style={{ color: theme.buttonDestructiveText, borderColor: "rgba(232, 160, 163, 0.45)" }}
                    >
                        CONFIRM CANCEL
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function SubscriptionCard({
    subscription,
    theme,
}: {
    subscription: Subscription
    theme: ProfileSubscriptionsTheme
}) {
    const status = String(subscription.status ?? "")
    const active = status.toLowerCase() === "active"
    const intervalValue = subscription.interval_value ?? 0
    const intervalScale = subscription.interval_scale ?? "day"
    const plural = intervalValue > 1 ? "s" : ""
    const period = `${intervalValue} ${intervalScale}${plural}`

    return (
        <ProfilePanel>
            <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                    <Image
                        src={subscription.product_image_url ?? "/images/placeholder.png"}
                        alt={String(subscription.product_name ?? "Product")}
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 object-cover"
                    />
                    <div className="min-w-0">
                        <p className="support-form-kicker text-[9px] font-bold tracking-[1.62px]">SUBSCRIPTION</p>
                        <h3 className="support-form-title truncate pt-1 text-[18px] font-extrabold leading-6">
                            {(subscription.product_name || "Plan").toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-1 pt-1">
                            <p className="truncate font-mono text-[12px] support-form-help">
                                {subscription.id}
                            </p>
                            <CopyButton text={String(subscription.id)} />
                        </div>
                        <p className="support-form-help pt-1 text-[12px]">
                            {subscription.total_amount_str ?? ""} · every {period}
                            {subscription.created_at ? ` · since ${new Date(String(subscription.created_at)).toDateString()}` : ""}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className={cn("ticket-chip", active ? "ticket-chip-yes" : "ticket-chip-no")}>
                        {active ? "ACTIVE" : status.toUpperCase() || "INACTIVE"}
                    </span>
                    <CancelButton id={subscription.id} status={status} theme={theme} />
                </div>
            </div>
        </ProfilePanel>
    )
}

interface SubscriptionsProps {
    serverTheme?: Record<string, unknown>
}

export default function Subscriptions({ serverTheme }: SubscriptionsProps) {
    const { data: clientTheme } = useProfileTheme()
    const theme = React.useMemo(
        () => withUserDefaults(clientTheme || serverTheme),
        [clientTheme, serverTheme],
    )
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("all")
    const [page, setPage] = React.useState(1)
    const { data: subscriptions, isLoading, isSuccess } = useSubscriptions()

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        const rows = isSuccess ? subscriptions : []
        return rows.filter((row) => {
            const status = String(row.status ?? "").toLowerCase()
            if (statusFilter !== "all" && status !== statusFilter) return false
            if (!q) return true
            return `${row.id} ${row.product_name ?? ""} ${status}`.toLowerCase().includes(q)
        })
    }, [isSuccess, subscriptions, search, statusFilter])

    React.useEffect(() => {
        setPage(1)
    }, [search, statusFilter])

    const pageCount = Math.max(1, Math.ceil(filtered.length / PROFILE_PAGE_SIZE))
    const paged = filtered.slice((page - 1) * PROFILE_PAGE_SIZE, page * PROFILE_PAGE_SIZE)

    return (
        <div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <ProfileSearch value={search} onChange={setSearch} placeholder="Search subscriptions…" className="md:max-w-sm" />
                <ProfileStatusTabs
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: "all", label: "ALL" },
                        { value: "active", label: "ACTIVE" },
                        { value: "canceled", label: "CANCELED" },
                    ]}
                />
            </div>

            <div className="space-y-3 pt-5">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-[120px] animate-pulse border"
                            style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(8,12,17,0.6)" }}
                        />
                    ))
                ) : paged.length === 0 ? (
                    <ProfileEmpty
                        kicker="STORE"
                        title={subscriptions && subscriptions.length > 0 ? "NO MATCHING SUBSCRIPTIONS" : "NO SUBSCRIPTIONS"}
                        body={subscriptions && subscriptions.length > 0
                            ? "Try a different search or status filter."
                            : "Recurring store purchases will show up here."}
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
                    paged.map((subscription) => (
                        <SubscriptionCard key={subscription.id} subscription={subscription} theme={theme} />
                    ))
                )}
            </div>

            {!isLoading && filtered.length > 0 ? (
                <ProfilePager
                    page={page}
                    pageCount={pageCount}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
                    summary={`${filtered.length} subscription${filtered.length === 1 ? "" : "s"}`}
                />
            ) : null}
        </div>
    )
}
