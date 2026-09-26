'use client'

import { signOut } from "@/lib/laravel-auth-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOutIcon, ShieldAlertIcon, Copy, Check, ChevronDown } from 'lucide-react'
import Link from "next/link"
import { UserSession } from "@/types/next-auth"
import { useState } from "react"
import { DiscordIcon } from "@/components/icons"
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HomeCardCorners } from "@/components/home/home-card-corners"

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
        ta.style.position = "fixed"
        ta.style.left = "-9999px"
        ta.setAttribute("readonly", "")
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
            onClick={() => {
                void copyToClipboard(text).then((ok) => {
                    if (!ok) return
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                })
            }}
            aria-label="Copy"
        >
            {copied ? <Check className="h-3.5 w-3.5 ticket-status-open" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    )
}

function RolePills({ user, theme }: { user: UserSession; theme: ReturnType<typeof withUserDefaults> }) {
    if (!user?.roles || user.roles.length === 0) return null
    const sortedRoles = [...user.roles].sort((a, b) => {
        const orderA = a.role?.order ?? Infinity
        const orderB = b.role?.order ?? Infinity
        return orderA - orderB
    })
    const visibleRoles = sortedRoles.slice(0, 4)
    const remainingRoles = sortedRoles.slice(4)

    return (
        <div className="flex flex-wrap gap-2">
            {visibleRoles.map((userRole, index) => (
                <span
                    key={userRole.roleId ?? index}
                    className="ticket-chip"
                    style={userRole.role?.color ? {
                        borderColor: userRole.role.color,
                        color: userRole.role.color,
                    } : {
                        borderColor: theme.roleBadgeBorder,
                        color: theme.roleBadgeText,
                    }}
                >
                    {userRole.role?.name}
                </span>
            ))}
            {remainingRoles.length > 0 && (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="ticket-chip ghost"
                            style={{ borderColor: theme.roleBadgeBorder, color: theme.roleBadgeText }}
                        >
                            +{remainingRoles.length} MORE
                            <ChevronDown className="ml-1 h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="site-user-menu z-[200] max-h-96 w-56 overflow-y-auto rounded-none">
                        {remainingRoles.map((userRole, index) => (
                            <DropdownMenuItem
                                key={userRole.roleId ?? index}
                                className="site-user-menu-item cursor-default rounded-none p-2"
                                onSelect={(e) => e.preventDefault()}
                            >
                                <span className="ticket-chip w-full" style={userRole.role?.color ? {
                                    borderColor: userRole.role.color,
                                    color: userRole.role.color,
                                } : undefined}>
                                    {userRole.role?.name}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}

interface ProfileHeaderProps {
    user: UserSession;
    serverTheme?: Record<string, unknown>;
}

export default function ProfileHeader({ user, serverTheme }: ProfileHeaderProps) {
    const { data: clientTheme } = useProfileTheme();
    const theme = withUserDefaults(clientTheme || serverTheme);

    return (
        <article
            className="profile-identity relative mt-10 overflow-visible border"
            style={{
                borderColor: theme.headerCardBorder,
                backgroundColor: theme.headerCardBackground,
            }}
        >
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(127.57deg, rgba(30, 26, 17, 0.96) 8.5%, rgba(8, 12, 17, 0.94) 91.5%)",
                }}
            />

            <div className="relative flex flex-col gap-6 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 sm:gap-5">
                    <Avatar className="h-20 w-20 rounded-none sm:h-24 sm:w-24" style={{ border: `1px solid ${theme.avatarBorderColor}` }}>
                        <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                        <AvatarFallback className="rounded-none">{user?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="support-form-kicker text-[9px] font-bold tracking-[1.62px]">PLAYER</p>
                        <h2 className="support-form-title truncate pt-1 text-[22px] font-extrabold leading-7">
                            {(user?.name || "Unknown").toUpperCase()}
                        </h2>
                        <div className="pt-3">
                            <RolePills user={user} theme={theme} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {user?.steamId ? (
                        <a
                            href={`https://steamcommunity.com/profiles/${user.steamId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ghost support-form-btn-secondary flex h-[41px] items-center px-4 text-[10px] font-bold tracking-[1.4px]"
                        >
                            STEAM PROFILE
                        </a>
                    ) : null}
                    {user.isAdmin ? (
                        <Link
                            href="/admin"
                            className="ghost support-form-btn-primary flex h-[41px] items-center px-4 text-[10px] font-bold tracking-[1.4px]"
                        >
                            <ShieldAlertIcon size={16} className="mr-2" />
                            ADMIN
                        </Link>
                    ) : null}
                    <button
                        type="button"
                        className="ghost support-form-btn-secondary flex h-[41px] items-center px-4 text-[10px] font-bold tracking-[1.4px]"
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOutIcon size={16} className="mr-2" />
                        LOG OUT
                    </button>
                </div>
            </div>

            <div
                className="relative grid gap-5 border-t px-5 py-5 sm:grid-cols-2 sm:px-7"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
                <div>
                    <p className="support-form-label">Steam ID</p>
                    <div className="mt-2 flex items-center gap-1">
                        <p className="truncate font-mono text-[13px]" style={{ color: theme.userNameColor }}>
                            {user?.steamId || "Not linked"}
                        </p>
                        {user?.steamId ? <CopyButton text={user.steamId} /> : null}
                    </div>
                </div>
                <div>
                    <p className="support-form-label">Discord ID</p>
                    <div className="mt-2 flex items-center gap-1">
                        {user?.discordId ? (
                            <>
                                <p className="truncate font-mono text-[13px]" style={{ color: theme.userNameColor }}>
                                    {user.discordId}
                                </p>
                                <CopyButton text={user.discordId} />
                            </>
                        ) : (
                            <button
                                type="button"
                                className="ghost flex items-center gap-2 text-[13px]"
                                style={{ color: theme.linkColor }}
                                onClick={() => { window.location.href = '/api/link/discord/start' }}
                            >
                                <DiscordIcon className="h-4 w-4" />
                                Link Discord
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <HomeCardCorners color="#ba9142" show />
        </article>
    )
}
