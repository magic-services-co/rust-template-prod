'use client'

import { signOut } from "@/lib/laravel-auth-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOutIcon, ShieldAlertIcon, Copy, Check, ChevronDown } from 'lucide-react'
import Link from "next/link"
import { cn } from "@/lib/utils"
import { UserSession } from "@/types/next-auth"
import { useState } from "react"
import { DiscordIcon } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

async function copyToClipboard(value: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(value)
            return true
        } catch {
            /* fall through to legacy */
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

function CopyButton({ text, serverTheme }: { text: string, serverTheme?: any }) {
    const { data: clientTheme } = useProfileTheme();
    const theme = withUserDefaults(clientTheme || serverTheme);
    
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        void copyToClipboard(text).then((ok) => {
            if (!ok) return
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="w-8 h-8 p-0 hover:opacity-80 transition-opacity"
            style={{
                backgroundColor: theme.copyButtonBackground,
                color: theme.copyButtonText,
                borderRadius: theme.buttonBorderRadius
            }}
        >
            {copied ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
        </Button>
    )
}

interface ProfileHeaderProps {
    user: UserSession;
    serverTheme?: any;
}

export default function ProfileHeader({ user, serverTheme }: ProfileHeaderProps) {
    const { data: clientTheme } = useProfileTheme();
    const theme = withUserDefaults(clientTheme || serverTheme);
    const handleLogout = () => {
        signOut({ callbackUrl: "/" })
    }

    return (
        <Card 
            className="mb-8 backdrop-blur hover:brightness-110 transition-all duration-300"
            style={{
                backgroundColor: theme.headerCardBackground,
                border: `1px solid ${theme.headerCardBorder}`,
                borderRadius: theme.cardBorderRadius,
                boxShadow: theme.cardShadow
            }}
        >
            <CardContent style={{ padding: theme.cardPadding }}>
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Avatar 
                            className="w-24 h-24"
                            style={{
                                border: `2px solid ${theme.avatarBorderColor}`
                            }}
                        >
                            <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                            <AvatarFallback>{user?.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="hidden md:block">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {(() => {
                                    if (!user?.roles || user.roles.length === 0) return null;
                                    
                                    const sortedRoles = [...user.roles].sort((a, b) => {
                                        const orderA = a.role?.order ?? Infinity;
                                        const orderB = b.role?.order ?? Infinity;
                                        return orderA - orderB;
                                    });
                                    
                                    const visibleRoles = sortedRoles.slice(0, 4);
                                    const remainingRoles = sortedRoles.slice(4);
                                    
                                    return (
                                        <>
                                            {visibleRoles.map((userRole, index) => (
                                                <Badge
                                                    key={userRole.roleId ?? index}
                                                    variant="outline"
                                                    className="capitalize"
                                                    style={userRole.role?.color ? {
                                                        backgroundColor: `${userRole.role.color}20`,
                                                        borderColor: userRole.role.color,
                                                        color: userRole.role.color,
                                                        borderRadius: theme.buttonBorderRadius
                                                    } : {
                                                        backgroundColor: theme.roleBadgeBackground,
                                                        borderColor: theme.roleBadgeBorder,
                                                        color: theme.roleBadgeText,
                                                        borderRadius: theme.buttonBorderRadius
                                                    }}
                                                >
                                                    {userRole.role?.name}
                                                </Badge>
                                            ))}
                                            {remainingRoles.length > 0 && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-6 px-2 text-xs capitalize"
                                                            style={{
                                                                backgroundColor: theme.roleBadgeBackground,
                                                                borderColor: theme.roleBadgeBorder,
                                                                color: theme.roleBadgeText,
                                                                borderRadius: theme.buttonBorderRadius
                                                            }}
                                                        >
                                                            +{remainingRoles.length} more
                                                            <ChevronDown className="ml-1 h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="max-h-96 overflow-y-auto w-56">
                                                        {remainingRoles.map((userRole, index) => (
                                                            <DropdownMenuItem 
                                                                key={userRole.roleId ?? index} 
                                                                className="p-2 cursor-default" 
                                                                onSelect={(e) => e.preventDefault()}
                                                            >
                                                                <Badge
                                                                    variant="outline"
                                                                    className="capitalize w-full"
                                                                    style={userRole.role?.color ? {
                                                                        backgroundColor: `${userRole.role.color}20`,
                                                                        borderColor: userRole.role.color,
                                                                        color: userRole.role.color,
                                                                        borderRadius: theme.buttonBorderRadius
                                                                    } : {
                                                                        backgroundColor: theme.roleBadgeBackground,
                                                                        borderColor: theme.roleBadgeBorder,
                                                                        color: theme.roleBadgeText,
                                                                        borderRadius: theme.buttonBorderRadius
                                                                    }}
                                                                >
                                                                    {userRole.role?.name}
                                                                </Badge>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            <h1 
                                className="text-2xl font-bold"
                                style={{ color: theme.userNameColor }}
                            >
                                {user?.name}
                            </h1>
                            <div className="flex items-center space-x-2">
                                <p 
                                    className="text-sm"
                                    style={{ color: theme.userIdColor }}
                                >
                                    Steam ID: {user?.steamId || 'N/A'}
                                </p>
                                {user?.steamId ? <CopyButton text={user.steamId} serverTheme={theme} /> : null}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span 
                                    className="flex items-center gap-2 text-sm"
                                    style={{ color: theme.userIdColor }}
                                >
                                    Discord ID: {user?.discordId ? user.discordId : (
                                        <span
                                            className="flex font-normal items-center gap-2 cursor-pointer opacity-65 hover:opacity-100 duration-200"
                                            style={{ color: theme.linkColor }}
                                            onClick={() => {
                                                window.location.href = '/api/link/discord/start';
                                            }}
                                        >
                                            <DiscordIcon className="w-4 h-4" /> Link Discord
                                        </span>
                                    )}
                                </span>
                                {user?.discordId ? <CopyButton text={user.discordId} serverTheme={theme} /> : null}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-row-reverse md:flex-col gap-2">
                        <Button
                            onClick={handleLogout}
                            variant="destructive"
                            className="mt-5 md:mt-0 w-full md:w-auto hover:opacity-90 transition-opacity"
                            style={{
                                backgroundColor: theme.buttonDestructiveBackground,
                                color: theme.buttonDestructiveText,
                                borderRadius: theme.buttonBorderRadius
                            }}
                        >
                            <LogOutIcon size={18} className="mr-2.5" />
                            Logout
                        </Button>
                        {user.isAdmin ? (
                            <Link
                                href="/admin"
                                className={cn(
                                    buttonVariants({ variant: "default" }),
                                    "mt-5 md:mt-0 w-full md:w-auto hover:opacity-90 transition-opacity"
                                )}
                                style={{
                                    backgroundColor: theme.buttonSuccessBackground,
                                    color: theme.buttonSuccessText,
                                    borderRadius: theme.buttonBorderRadius
                                }}
                            >
                                <ShieldAlertIcon size={18} className="mr-2.5" />
                                Admin
                            </Link>
                        ) : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}