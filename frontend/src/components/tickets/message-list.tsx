"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { TicketMessage } from "@/types/tickets"
import { format, formatDistanceToNow } from "date-fns"
import { User } from "next-auth"
import { useEffect, useMemo, useRef, useState } from "react"
import { ScrollArea } from "../ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton"
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Image from 'next/image';
import { getDiscordAvatarUrl } from '@/lib/discord'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { HomeCardCorners } from "@/components/home/home-card-corners"

interface MessageListProps {
    ticketId: number
    currentUser: User
    themed?: boolean
}

interface MessageProps {
    message: TicketMessage
    isCurrentUser: boolean
    onImageClick: (images: string[], startIndex: number) => void
    themed?: boolean
}

interface DiscordProfile {
    id: string
    username: string
    global_name?: string | null
    avatar?: string | null
}

export function MessageList({ ticketId, currentUser, themed }: MessageListProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    const [initialCount, setInitialCount] = useState<number>(-1);

    const { data: messages, isLoading } = useQuery<TicketMessage[] | undefined>({
        queryKey: ['messages', ticketId],
        queryFn: async () => {
            const token = getAuthToken()
            const headers: Record<string, string> = { Accept: 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(backendApi(`tickets/${ticketId}/messages`), { credentials: 'include', headers })
            if (!res.ok) return undefined
            return res.json()
        },
    });

    const reverseMessages = useMemo(() => {
        return messages ? [...messages].reverse() : []
    }, [messages])

    const discordIds = useMemo(() => {
        return Array.from(
            new Set(
                reverseMessages
                    .map((message) => message.discordUserId)
                    .filter((id): id is string => Boolean(id))
            )
        )
    }, [reverseMessages])

    const { data: discordProfiles } = useQuery({
        queryKey: ['discord-profiles', ticketId, discordIds],
        queryFn: async (): Promise<Record<string, DiscordProfile>> => {
            if (discordIds.length === 0) {
                return {}
            }

            const entries = await Promise.all(discordIds.map(async (id) => {
                try {
                    const response = await fetch(`/api/discord/users/${id}`)
                    if (!response.ok) {
                        return [id, null] as const
                    }
                    const data = await response.json()
                    return [id, data.profile ?? null] as const
                } catch (error) {
                    console.error('Failed to load Discord profile', error)
                    return [id, null] as const
                }
            }))

            return entries.reduce<Record<string, DiscordProfile>>((acc, [id, profile]) => {
                if (profile) {
                    acc[id] = profile
                }
                return acc
            }, {})
        },
        staleTime: 1000 * 60 * 5,
        enabled: discordIds.length > 0,
    })

    const allImages = useMemo(() => {
        if (!reverseMessages.length) return [];
        return reverseMessages.reduce<string[]>((acc, message) => {
            try {
                const messageAttachments = JSON.parse(message.attachments ?? '[]');
                return [...acc, ...messageAttachments];
            } catch {
                return acc;
            }
        }, []);
    }, [reverseMessages]);

    const lightboxSlides = useMemo(() => {
        return allImages.map(src => ({ src }));
    }, [allImages]);

    const handleImageClick = (messageImages: string[], startIndex: number) => {
        const clickedImage = messageImages[startIndex];
        const globalIndex = allImages.findIndex(img => img === clickedImage);
        setLightboxIndex(Math.max(0, globalIndex));
        setLightboxOpen(true);
    };

    useEffect(() => {
        if (reverseMessages.length > 0 && scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
        if (reverseMessages.length > 0) {
            setInitialCount(reverseMessages.length)
        }
    }, [reverseMessages])

    if (isLoading) return <MessageListSkeleton />

    return (
        <>
            <div ref={scrollAreaRef} className="max-h-[800px] h-auto overflow-auto">
                <div className="w-full space-y-4">
                    {reverseMessages.length === 0 ? (
                        <div className={themed ? "ticket-message px-5 py-10 text-center" : "py-8 text-center"}>
                            <p className={themed ? "support-form-kicker text-[9px] font-bold tracking-[1.62px]" : "sr-only"}>WAITING</p>
                            <p className={themed ? "support-form-meta pt-2 text-[13px] tracking-normal" : "text-sm text-muted-foreground"}>
                                No replies yet. Staff will respond here.
                            </p>
                        </div>
                    ) : reverseMessages.map((message) => (
                        <Message
                            key={message.id}
                            message={message}
                            isCurrentUser={message.userId === currentUser.id}
                            onImageClick={handleImageClick}
                            discordProfile={message.discordUserId ? discordProfiles?.[message.discordUserId] : undefined}
                            themed={themed}
                        />
                    ))}
                </div>
            </div>
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={lightboxSlides}
                index={lightboxIndex}
                on={{
                    view: ({ index }) => setLightboxIndex(index)
                }}
            />
        </>
    )
}

export function MessageListSkeleton() {
    return (
        <ScrollArea className="h-[800px] pr-4">
            <div className="space-y-4 w-full">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="rounded-md w-full p-6 space-y-4 border border-border/30">
                        <div className="flex justify-between items-center border-b border-border/30 pb-2">
                            <div className="flex gap-2.5 items-center">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}

function Message({ message, isCurrentUser, onImageClick, discordProfile, themed }: MessageProps & { discordProfile?: DiscordProfile }) {
    const displayName = useMemo(() => {
        if (discordProfile) {
            return discordProfile.global_name || discordProfile.username
        }
        return message.user?.name
    }, [discordProfile, message.user?.name])

    const avatarSrc = useMemo(() => {
        if (discordProfile) {
            return getDiscordAvatarUrl(discordProfile.id, discordProfile.avatar)
        }
        return message.user?.image ?? ''
    }, [discordProfile, message.user?.image])

    const source = typeof message.source === "string" ? message.source.toUpperCase() : "WEB"
    const createdAt = message.createdAt ?? new Date(0)

    return (
        <div className={cn(
            'w-full space-y-4 p-5',
            themed
                ? (isCurrentUser ? 'ticket-message-own ticket-message' : 'ticket-message')
                : (isCurrentUser ? 'rounded-md bg-muted/25 text-secondary-foreground' : 'rounded-md border border-border/30')
        )}>
            <div className={cn("flex items-center justify-between pb-4", themed ? "border-b border-white/10" : "border-b border-border/30")}>
                <div className="flex items-center gap-2.5">
                    <Avatar className={cn("h-12 w-12", themed && "rounded-none")}>
                        <AvatarImage src={avatarSrc} alt={displayName ?? ''} />
                        <AvatarFallback>{displayName?.[0] ?? ''}</AvatarFallback>
                    </Avatar>
                    <div>
                        <span className="text-lg font-medium">{displayName}</span>
                        {themed ? (
                            <p className="support-form-meta text-[10px] tracking-[1.2px]">
                                {isCurrentUser ? "YOU" : "STAFF"}
                                {source === "DISCORD" ? " · DISCORD" : ""}
                            </p>
                        ) : null}
                    </div>
                </div>
                <span className={cn("text-right text-sm", themed ? "support-form-meta tracking-normal" : "opacity-70")}>
                    <span className="block">{format(createdAt, 'MMM d, yyyy h:mm a')}</span>
                    {themed ? (
                        <span className="mt-0.5 block text-[11px]">
                            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                        </span>
                    ) : null}
                </span>
            </div>
            <div className={themed ? "ticket-message-body text-sm" : "text-sm"} dangerouslySetInnerHTML={{ __html: message.content ?? '' }} />
            <MessageAttachments attachments={message.attachments ?? ''} onImageClick={onImageClick} themed={themed} />
            {themed ? <HomeCardCorners color="#ba9142" show /> : null}
        </div>
    )
}

function MessageAttachments({ attachments: data, onImageClick, themed }: { attachments: string, onImageClick: (images: string[], startIndex: number) => void, themed?: boolean }) {
    const attachments = useMemo<string[]>(() => {
        try {
            return JSON.parse(data);
        } catch {
            return [];
        }
    }, [data])

    if (attachments.length === 0) return null

    return (
        <div className="flex gap-2.5 items-center">
            {attachments.map((attachment, index) => (
                <Image
                    key={attachment}
                    src={attachment}
                    alt="Attachment"
                    className={cn("w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity", themed ? "rounded-none" : "rounded-md")}
                    width={64}
                    height={64}
                    onClick={() => onImageClick(attachments, index)}
                />
            ))}
        </div>
    )
}