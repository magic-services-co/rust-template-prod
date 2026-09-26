"use client"

import { cn } from "@/lib/utils"
import type { CSSProperties, ReactNode } from "react"

export function ProfilePanel({
    children,
    className,
    hover = false,
    style,
}: {
    children: ReactNode
    className?: string
    hover?: boolean
    style?: CSSProperties
}) {
    return (
        <article
            className={cn(
                "profile-panel relative overflow-visible border",
                hover && "support-ticket-card",
                className,
            )}
            style={{
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "rgba(8, 12, 17, 0.94)",
                ...style,
            }}
        >
            {children}
            <span
                aria-hidden
                className="support-ticket-corner pointer-events-none absolute left-[-1px] top-[-1px] z-[2] border-l-2 border-t-2"
                style={{ borderColor: "#ba9142" }}
            />
            <span
                aria-hidden
                className="support-ticket-corner pointer-events-none absolute bottom-[-1px] right-[-1px] z-[2] border-b-2 border-r-2"
                style={{ borderColor: "#ba9142" }}
            />
        </article>
    )
}

export function ProfileEmpty({
    kicker,
    title,
    body,
    action,
}: {
    kicker: string
    title: string
    body: string
    action?: ReactNode
}) {
    return (
        <ProfilePanel className="px-6 py-12 text-center sm:px-10">
            <p className="support-form-kicker text-[9px] font-bold tracking-[1.62px]">{kicker}</p>
            <h3 className="support-form-title pt-2 text-[20px] font-extrabold leading-7">{title}</h3>
            <p className="support-form-help mx-auto max-w-md pt-2">{body}</p>
            {action ? <div className="pt-5">{action}</div> : null}
        </ProfilePanel>
    )
}

export function ProfilePager({
    page,
    pageCount,
    onPrev,
    onNext,
    summary,
}: {
    page: number
    pageCount: number
    onPrev: () => void
    onNext: () => void
    summary: string
}) {
    if (pageCount <= 1) {
        return (
            <p className="support-form-help pt-4 text-[12px]">{summary}</p>
        )
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <p className="support-form-help text-[12px]">{summary}</p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="ghost support-form-btn-secondary h-[41px] px-4 text-[10px] font-bold tracking-[1.4px] disabled:opacity-40"
                    onClick={onPrev}
                    disabled={page <= 1}
                >
                    PREV
                </button>
                <span className="support-form-meta px-1 text-[11px] tracking-[0.4px]">
                    {page} / {pageCount}
                </span>
                <button
                    type="button"
                    className="ghost support-form-btn-secondary h-[41px] px-4 text-[10px] font-bold tracking-[1.4px] disabled:opacity-40"
                    onClick={onNext}
                    disabled={page >= pageCount}
                >
                    NEXT
                </button>
            </div>
        </div>
    )
}

export function ProfileSearch({
    value,
    onChange,
    placeholder,
    className,
}: {
    value: string
    onChange: (value: string) => void
    placeholder: string
    className?: string
}) {
    return (
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={cn("support-form-input h-[41px] w-full px-3 text-[13px] outline-none", className)}
        />
    )
}

export function ProfileStatusTabs({
    value,
    onChange,
    options,
    className,
}: {
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    className?: string
}) {
    return (
        <div
            className={cn("store-tab-scroller flex min-w-0 max-w-full gap-1 overflow-x-auto border p-1", className)}
            style={{
                backgroundColor: "#0a0e14",
                borderColor: "rgba(255, 255, 255, 0.1)",
                ["--store-tab-inactive" as string]: "#93a4b8",
                ["--store-tab-active-text" as string]: "#080a0e",
                ["--store-tab-active-bg" as string]: "#ba9142",
            }}
        >
            {options.map((option) => {
                const isActive = value === option.value
                return (
                    <button
                        key={option.value}
                        type="button"
                        className={cn(
                            "ghost shrink-0 whitespace-nowrap px-4 py-2 text-center text-[10px] font-bold tracking-[1.4px]",
                            isActive ? "store-tab-active" : "store-tab",
                        )}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}

export function padTicketId(id: string | number | undefined): string {
    return `#${String(id ?? "").padStart(4, "0")}`
}

export const PROFILE_PAGE_SIZE = 8
