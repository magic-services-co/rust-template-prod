"use client";

import { SteamIcon, DiscordIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { UserSession } from "@/types/next-auth";
import { signIn } from "@/lib/laravel-auth-react";
import { CheckIcon, Loader2, UnlinkIcon, StarIcon, RefreshCcwIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { getAuthToken } from "@/lib/laravel-auth";
import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { refreshSteamGroup } from "@/app/actions/steam";
import { useRouter } from "next/navigation";
import { LINKED_USERS_COUNT_QUERY_KEY } from "@/components/linked-users-count";

interface LinkProps {
    user?: UserSession | null
    linkStatus?: 'success' | 'error' | null
}

function getStepStatus(user?: UserSession | null) {
    const steamLinked = !!user?.steamId;
    const discordLinked = !!user?.discordId;
    if (!steamLinked) return 0; 
    if (!discordLinked) return 1; 
    return 2; 
}

export default function AccountLinkStepper({ user, linkStatus }: LinkProps) {
    const step = getStepStatus(user);
    const queryClient = useQueryClient();
    const { data: settings } = useSiteSettings();
    const router = useRouter();
    const [isLinkingDiscord, setIsLinkingDiscord] = useState(false);
    
    const isGroupEnabled = useMemo(() => {
        return !!settings?.steamGroupId && !!settings?.steamGroupUrl;
    }, [settings?.steamGroupId, settings?.steamGroupUrl]);

    useEffect(() => {
        if (linkStatus === 'success') {
            toast.success('Successfully linked Discord and imported previous tickets');
            document.cookie = 'discord_link_status=; Max-Age=0; path=/';
            queryClient.invalidateQueries({ queryKey: LINKED_USERS_COUNT_QUERY_KEY });
        } else if (linkStatus === 'error') {
            toast.error('Discord linking failed. Please try again.');
            document.cookie = 'discord_link_status=; Max-Age=0; path=/';
        }
    }, [linkStatus, queryClient]);

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
                throw new Error(data?.error ?? data?.message ?? "Failed to unlink account");
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

    const refreshMutation = useMutation({
        mutationFn: async () => {
            const result = await refreshSteamGroup();
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
        <div className="flex flex-col items-center justify-center w-full -mt-6">
            <div className="flex w-full max-w-2xl justify-between items-center mb-6 relative">
                <div className="flex flex-col items-center flex-1">
                    <div className={`rounded-full border-4 ${step >= 0 ? 'border-green-500 bg-[#23232a]' : 'border-gray-700 bg-[#18181c]'} ${step === 0 ? 'shadow-[0_0_20px_rgba(34,197,94,0.6),0_0_40px_rgba(34,197,94,0.4)]' : 'shadow-lg'} w-24 h-24 flex items-center justify-center mb-2 transition-all duration-300`}>
                        <SteamIcon className="w-16 h-16 text-green-500" />
                    </div>
                    <span className={`text-lg font-semibold ${step >= 0 ? 'text-green-500' : 'text-gray-500'}`}>Steam</span>
                </div>
                <div className="flex-1 h-2 mx-2 bg-[#23232a] rounded-full relative">
                    <div className={`absolute h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-green-500 w-full' : 'bg-green-500 w-1/2'}`}></div>
                </div>
                <div className="flex flex-col items-center flex-1">
                    <div className={`rounded-full border-4 ${step >= 1 ? 'border-green-500 bg-[#23232a]' : 'border-gray-700 bg-[#18181c]'} ${step === 1 ? 'shadow-[0_0_20px_rgba(34,197,94,0.6),0_0_40px_rgba(34,197,94,0.4)]' : 'shadow-lg'} w-24 h-24 flex items-center justify-center mb-2 transition-all duration-300`}>
                        <DiscordIcon className="w-16 h-16 text-green-500" />
                    </div>
                    <span className={`text-lg font-semibold ${step >= 1 ? 'text-green-500' : 'text-gray-500'}`}>Discord</span>
                </div>
                <div className="flex-1 h-2 mx-2 bg-[#23232a] rounded-full relative">
                  {step === 2 && (
                    <div className="absolute h-2 rounded-full bg-green-500 w-full transition-all duration-300"></div>
                  )}
                </div>
                <div className="flex flex-col items-center flex-1">
                    <div className={`rounded-full border-4 ${step === 2 ? 'border-green-500 bg-[#23232a]' : 'border-gray-700 bg-[#18181c]'} ${step === 2 ? 'shadow-[0_0_20px_rgba(34,197,94,0.6),0_0_40px_rgba(34,197,94,0.4)]' : 'shadow-lg'} w-24 h-24 flex items-center justify-center mb-2 transition-all duration-300`}>
                        <CheckIcon className="w-16 h-16 text-green-500" />
                    </div>
                    <span className={`text-lg font-semibold ${step === 2 ? 'text-green-500' : 'text-gray-500'}`}>Done</span>
                </div>
                {step === 2 && user?.discordId && (
                    <div style={{ left: '50%', transform: 'translateX(-50%)' }} className="absolute top-[110%] flex flex-col items-center w-1/4 min-w-[160px]">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    disabled={unlinkMutation.isPending}
                                >
                                    {unlinkMutation.isPending ? (
                                        <Loader2 className="animate-spin mr-2" />
                                    ) : (
                                        <UnlinkIcon className="h-5 w-5 mr-2" />
                                    )}
                                    Unlink Discord
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Unlink Discord Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to unlink your Discord account?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => unlinkMutation.mutate()}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Unlink
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
            <div className="w-full max-w-2xl flex flex-col items-center">
                {step === 0 && (
                    <Button
                        onClick={() => signIn('steam')}
                        variant="outline"
                        size="lg"
                        className="border-primary/30 text-primary hover:bg-primary/10 text-lg py-6 px-8"
                    >
                        Sign In with Steam
                    </Button>
                )}
                {step === 1 && (
                    <div className="flex flex-col items-center gap-4">
                        <Button
                            size="lg"
                            className="py-6 text-lg group mb-4 w-full max-w-md bg-[#23232a] text-green-500 border-green-500 border-2 hover:bg-green-500 hover:text-white"
                            onClick={async () => {
                                setIsLinkingDiscord(true);
                                try {
                                    window.location.href = '/api/link/discord/start';
                                } catch (error) {
                                    console.error('Failed to start Discord linking:', error);
                                    toast.error('Failed to start Discord linking. Please try again.');
                                    setIsLinkingDiscord(false);
                                }
                            }}
                            disabled={isLinkingDiscord}
                        >
                            {isLinkingDiscord ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-2.5 animate-spin" />
                                    Redirecting to Discord...
                                </>
                            ) : (
                                <>
                                    <DiscordIcon className="w-6 h-6 mr-2.5 group-hover:animate-wiggle" />
                                    Link Discord
                                </>
                            )}
                        </Button>
                        {user?.discordId && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="lg"
                                        className="w-full max-w-md"
                                        disabled={unlinkMutation.isPending}
                                    >
                                        {unlinkMutation.isPending ? (
                                            <Loader2 className="animate-spin mr-2" />
                                        ) : (
                                            <UnlinkIcon className="h-5 w-5 mr-2" />
                                        )}
                                        Unlink Discord
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Unlink Discord Account</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to unlink your Discord account?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => unlinkMutation.mutate()}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Unlink
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )}
                {step === 2 && (
                    <div className="flex flex-col items-center">
                        <div className="mt-10 text-2xl text-green-500 font-bold mb-2">All accounts linked!</div>
                        <div className="text-lg text-gray-400 mb-8">You&apos;re all set. Enjoy the full experience.</div>
                        
                        <div className="w-full max-w-md space-y-4">
                            {isGroupEnabled && (
                                <div className="bg-[#23232a] p-4 rounded-lg border border-green-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <SteamIcon className="w-5 h-5 text-green-500" />
                                            <span className="font-semibold">Join Steam Group</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {user?.joinedSteamGroup ? (
                                                <CheckIcon className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <span className="text-sm text-gray-400">(Optional)</span>
                                            )}
                                            <Button
                                                onClick={() => refreshMutation.mutate()}
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                disabled={!user || refreshMutation.isPending}
                                            >
                                                {!refreshMutation.isPending ? (
                                                    <RefreshCcwIcon className="h-4 w-4" />
                                                ) : (
                                                    <Loader2 className="animate-spin h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    {!user?.joinedSteamGroup ? (
                                        <Button
                                            asChild
                                            size="lg"
                                            className="bg-green-500 text-white hover:bg-green-600 w-full mt-3"
                                        >
                                            <a
                                                href={settings?.steamGroupUrl ?? "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Join Group
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="bg-green-500 text-white hover:bg-green-600"
                                        >
                                            <a
                                                href={settings?.steamGroupUrl ?? "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Join Group
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="bg-[#23232a] rounded-xl border border-green-500/20 overflow-hidden">
                                <div className="px-4 py-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-500/10 p-2 rounded-lg">
                                                <StarIcon className="w-6 h-6 text-green-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Boost Discord Server</h3>
                                                <p className="text-sm text-gray-400">Support our community</p>
                                            </div>
                                        </div>
                                        {user?.isBoosting ? (
                                            <div className="flex items-center gap-2">
                                                <CheckIcon className="w-5 h-5 text-green-500" />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">(Optional)</span>
                                        )}
                                    </div>
                                    {!user?.isBoosting && (
                                        <p className="text-sm text-gray-400 mt-1">
                                            Get exclusive perks and help our community grow
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
