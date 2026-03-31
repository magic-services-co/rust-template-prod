'use client'

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordIcon, SteamIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { CheckIcon, Loader2, RefreshCcwIcon, UnlinkIcon } from 'lucide-react'
import Link from "next/link"
import { User } from "@/types/user"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/laravel-auth"
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
import { useMemo } from "react"
import { refreshSteamGroup, SteamGroupResponse } from "@/app/actions/steam"
import { useRouter } from "next/navigation"
import { useSiteSettings } from "@/hooks/use-site-settings"
import type { SiteSettings } from "@/hooks/use-site-settings"
import { UserSession } from "@/types/next-auth"
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"

interface ConnectedAccountsProps {
    user?: UserSession | null;
    serverTheme?: any;
}

export default function ConnectedAccounts({ user, serverTheme }: ConnectedAccountsProps) {
    const { data: clientTheme } = useProfileTheme();
    
    const theme = withUserDefaults(clientTheme || serverTheme);
    
    const { data: settings } = useSiteSettings()

    return (
        <div 
            className="grid grid-cols-1 gap-4 mt-4"
            style={{ gap: theme.spacing }}
        >
            <RenderSteam user={user} settings={settings} serverTheme={theme} />
            <RenderDiscord user={user} serverTheme={theme} />
        </div>
    )
}

function RenderSteam({ user, settings, serverTheme }: { user?: UserSession | null, settings?: SiteSettings, serverTheme?: any }) {
    const { data: clientTheme } = useProfileTheme();
    
    const theme = withUserDefaults(clientTheme || serverTheme);
    const router = useRouter()
    const isGroupEnabled = useMemo(() => {
        return !!settings?.steamGroupId && !!settings?.steamGroupUrl
    }, [settings?.steamGroupId, settings?.steamGroupUrl])

    const renderStage = useMemo(() => {
        if (!isGroupEnabled) return "1/1 - Connect your Steam Account"
        if (user?.joinedSteamGroup) return "2/2 - Joined Steam Group"
        return "1/2 - Join the Steam Group"
    }, [isGroupEnabled, user?.joinedSteamGroup])

    const mutation = useMutation({
        mutationFn: async () => {
            const result: SteamGroupResponse = await refreshSteamGroup();
            if (result?.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        onSuccess: () => {
            toast.success("Steam group membership refreshed");
            router.refresh();
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to refresh steam group membership");
        }
    });
    return (
        <Card 
            className="group relative backdrop-blur overflow-hidden hover:brightness-110 transition-all duration-300"
            style={{
                backgroundColor: theme.contentCardBackground,
                border: `1px solid ${theme.contentCardBorder}`,
                borderRadius: theme.cardBorderRadius,
                boxShadow: theme.cardShadow
            }}
        >
            <CardContent style={{ padding: theme.cardPadding }}>
                <SteamIcon
                    className="absolute -top-12 -left-12 rotate-45 h-48 w-48 -z-10 opacity-5 group-hover:scale-110 group-hover:rotate-[30deg] duration-300"
                    style={{ color: theme.connectedAccountIconColor }}
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <SteamIcon 
                            className="h-12 w-12" 
                            style={{ color: theme?.connectedAccountIconColor || "#ffffff" }}
                        />
                        <div>
                            <h3 
                                className="text-lg font-semibold"
                                style={{ color: theme.contentCardTitleColor }}
                            >
                                Steam
                            </h3>
                            <p 
                                className="text-sm"
                                style={{ color: theme.connectedAccountStageColor }}
                            >
                                {renderStage}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isGroupEnabled || user?.joinedSteamGroup ? (
                            <Button
                                onClick={() => { }}
                                size={'icon'}
                                disabled={true}
                                style={{
                                    backgroundColor: theme.buttonSuccessBackground,
                                    color: theme.buttonSuccessText,
                                    borderRadius: theme.buttonBorderRadius
                                }}
                            >
                                <CheckIcon />
                            </Button>
                        ) : (
                            <Link
                                href={!user ? "#" : settings?.steamGroupUrl ?? ""}
                                target="_blank"
                                className={cn(
                                    buttonVariants({
                                        size: "default",
                                    }),
                                    { "pointer-events-none opacity-50": !user },
                                    "hover:opacity-90 transition-opacity"
                                )}
                                style={{
                                    backgroundColor: theme.buttonPrimaryBackground,
                                    color: theme.buttonPrimaryText,
                                    borderRadius: theme.buttonBorderRadius
                                }}
                            >Join Group</Link>
                        )}
                        {isGroupEnabled && (
                            <Button
                                onClick={() => mutation.mutate()}
                                variant="outline"
                                disabled={!user || mutation.isPending}
                                className="hover:opacity-90 transition-opacity"
                                style={{
                                    backgroundColor: theme.buttonSecondaryBackground,
                                    color: theme.buttonSecondaryText,
                                    border: `1px solid ${theme.buttonSecondaryBorder}`,
                                    borderRadius: theme.buttonBorderRadius
                                }}
                            >
                                {!mutation.isPending ? (
                                    <RefreshCcwIcon className="h-4 w-4" />
                                ) : (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


function RenderDiscord({ user, serverTheme }: { user?: UserSession | null, serverTheme?: any }) {
    const { data: clientTheme } = useProfileTheme();
    
    const theme = withUserDefaults(clientTheme || serverTheme);
    const unlinkMutation = useMutation({
        mutationFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const response = await fetch("/api/user/unlink", {
                method: "DELETE",
                credentials: "include",
                headers,
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const reason = data?.reason;
                const msg = data?.error ?? data?.message ?? "Failed to unlink account";
                if (response.status === 401 && (reason === "no_token" || !token)) {
                    throw new Error("Your session has expired or you're signed in from a different address. Please sign in again.");
                }
                throw new Error(msg);
            }
            window.location.reload();
        },
        onSuccess: () => {
            toast.success("Discord account unlinked");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to unlink Discord account");
        },
    });
    return (
        <Card 
            className="group relative backdrop-blur overflow-hidden hover:brightness-110 transition-all duration-300"
            style={{
                backgroundColor: theme.contentCardBackground,
                border: `1px solid ${theme.contentCardBorder}`,
                borderRadius: theme.cardBorderRadius,
                boxShadow: theme.cardShadow
            }}
        >
            <CardContent style={{ padding: theme.cardPadding }}>
                <DiscordIcon
                    className="absolute -top-12 -left-12 rotate-45 h-48 w-48 -z-10 opacity-5 group-hover:scale-110 group-hover:rotate-[30deg] duration-300"
                    style={{ color: theme.connectedAccountIconColor }}
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <DiscordIcon 
                            className="h-12 w-12" 
                            style={{ color: theme?.connectedAccountIconColor || "#ffffff" }}
                        />
                        <div>
                            <h3 
                                className="text-lg font-semibold"
                                style={{ color: theme.contentCardTitleColor }}
                            >
                                Discord
                            </h3>
                            {!user?.discordId ? (
                                <p 
                                    className="text-sm"
                                    style={{ color: theme.connectedAccountStageColor }}
                                >
                                    0/2 - Connect your Discord account
                                </p>
                            ) : null}
                            {!!user?.discordId ? (
                                <p 
                                    className="text-sm"
                                    style={{ color: theme.connectedAccountStageColor }}
                                >
                                    1/2 - Boost the discord server <span className="text-xs">(optional)</span>
                                </p>
                            ) : null}
                            {user?.isBoosting ? (
                                <p 
                                    className="text-sm"
                                    style={{ color: theme.connectedAccountStageColor }}
                                >
                                    2/2 - Boost the discord server
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => {
                                window.location.href = '/api/link/discord/start';
                            }}
                            size={!!user?.discordId ? "icon" : 'default'}
                            disabled={!user || !!user?.discordId}
                            className="hover:opacity-90 transition-opacity"
                            style={{
                                backgroundColor: !!user?.discordId 
                                    ? theme.buttonSuccessBackground
                                    : theme.buttonPrimaryBackground,
                                color: !!user?.discordId 
                                    ? theme.buttonSuccessText
                                    : theme.buttonPrimaryText,
                                borderRadius: theme.buttonBorderRadius
                            }}
                        >
                            {!!user?.discordId ? (
                                <CheckIcon />
                            ) : "Link Discord"}
                        </Button>
                        {!!user?.discordId && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        disabled={unlinkMutation.isPending || !user?.discordId}
                                        className="hover:opacity-90 transition-opacity"
                                        style={{
                                            backgroundColor: theme.buttonDestructiveBackground,
                                            color: theme.buttonDestructiveText,
                                            borderRadius: theme.buttonBorderRadius
                                        }}
                                    >
                                        {unlinkMutation.isPending ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            <UnlinkIcon className="h-4 w-4" />
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent
                                    style={{
                                        backgroundColor: theme.contentCardBackground,
                                        border: `1px solid ${theme.contentCardBorder}`,
                                        borderRadius: theme.cardBorderRadius
                                    }}
                                >
                                    <AlertDialogHeader>
                                        <AlertDialogTitle style={{ color: theme.contentCardTitleColor }}>
                                            Unlink Discord Account
                                        </AlertDialogTitle>
                                        <AlertDialogDescription style={{ color: theme.contentCardDescriptionColor }}>
                                            Are you sure you want to unlink your Discord account?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel
                                            style={{
                                                backgroundColor: theme.buttonSecondaryBackground,
                                                color: theme.buttonSecondaryText,
                                                border: `1px solid ${theme.buttonSecondaryBorder}`,
                                                borderRadius: theme.buttonBorderRadius
                                            }}
                                        >
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => unlinkMutation.mutate()}
                                            style={{
                                                backgroundColor: theme.buttonDestructiveBackground,
                                                color: theme.buttonDestructiveText,
                                                borderRadius: theme.buttonBorderRadius
                                            }}
                                        >
                                            Unlink
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}