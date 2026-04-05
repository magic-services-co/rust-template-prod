"use client"

import { useMemo, useState } from 'react'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ticket } from '@/types/tickets'
import { MessageList, MessageListSkeleton } from './message-list'
import { TipTapEditor } from './tiptap-editor'
import { ChevronLeft, AlertCircle, Clock, Calendar, DoorClosed, Loader2, X, FileText, Image as ImageIcon, FileArchive, Film, Music, Shield } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { User } from 'next-auth'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import useServers from '@/hooks/use-servers'

interface TicketViewProps {
    ticketId: number
    currentUser: User
}

interface SendMessageResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export function TicketView({ ticketId, currentUser }: TicketViewProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: ticket, isLoading } = useQuery<Ticket | undefined>({
        queryKey: ['ticket', ticketId],
        queryFn: async () => {
            const token = getAuthToken()
            const headers: Record<string, string> = { Accept: 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(backendApi(`tickets/${ticketId}`), { credentials: 'include', headers })
            if (!res.ok) return undefined
            return res.json()
        }
    })

    const { mutate: closeTicket, isPending: isClosingTicket } = useMutation({
        mutationFn: async () => {
            const token = getAuthToken()
            const headers: Record<string, string> = { Accept: 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(backendApi(`tickets/${ticketId}`), { method: 'DELETE', credentials: 'include', headers })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Failed to close ticket')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('Ticket closed successfully');
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
        },
        onError: (error) => {
            toast.error(error?.message || 'Error closing ticket');
        },
    })

    const { mutate: sendMessage, isPending: isSendingMessage } = useMutation<
        SendMessageResponse,
        Error,
        FormData
    >({
        mutationFn: async (formData: FormData) => {
            const token = getAuthToken()
            const headers: Record<string, string> = {}
            if (token) headers['Authorization'] = `Bearer ${token}`
            const response = await fetch(backendApi(`tickets/${ticketId}/messages`), {
                method: 'POST',
                credentials: 'include',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send message');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', ticketId] })
            toast.success('Message sent successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error sending message');
        },
    })

    if (isLoading) return <TicketSkeleton />
    if (!ticket) return <div>Ticket not found</div>

    const handleFilesSelected = async (files: File[]) => {
        setSelectedFiles(files);
        setIsScanning(true);
        try {
            for (let i = 0; i < files.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } finally {
            setIsScanning(false);
        }
    };

    const handleNewMessage = (content: string) => {
        const formData = new FormData();
        formData.append('message', content);

        selectedFiles.forEach((file) => {
            formData.append('files', file);
        });

        sendMessage(formData);
        setSelectedFiles([]);
    }

    return (
        <div className="mx-auto py-4 space-y-4">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/profile?tab=tickets')}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Tickets
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => closeTicket()}
                    disabled={isClosingTicket || ticket.status === 'closed'}
                >
                    {isClosingTicket ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Closing Ticket
                        </>
                    ) : (
                        <>
                            <DoorClosed className="mr-2 h-4 w-4" />
                            Close Ticket
                        </>
                    )}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl flex items-center gap-6">
                            {ticket.category?.name}
                            <Badge variant={ticket.status === 'closed' ? "destructive" : "active"}>
                                {ticket.status === 'closed' ? 'CLOSED' : 'OPEN'}
                            </Badge>
                        </CardTitle>
                        <Badge variant="outline" className="text-base">#{ticket.id}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <div className="flex gap-10">
                        <div className="flex flex-col items-start">
                            <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" /> Created
                            </span>
                            <span className="text-sm text-muted-foreground">{format(new Date(ticket.createdAt ?? 0), "MMM d, yyyy h:mm a")}</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" /> Updated
                            </span>
                            <span className="text-sm text-muted-foreground">{format(new Date(ticket.updatedAt ?? 0), "MMM d, yyyy h:mm a")}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className='p-6 pr-2'>
                    <QuestionsAndAnswers ticket={ticket} />
                    <MessageList ticketId={ticketId} currentUser={currentUser} />
                </CardContent>
                <CardFooter className='flex flex-col gap-4 w-full'>
                    {ticket.status === 'closed' ? (
                        <div className="w-full select-none flex items-center justify-center">
                            <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
                            <span className="text-destructive font-semibold">This ticket has been closed.</span>
                        </div>
                    ) : (
                        <TipTapEditor
                            onSend={handleNewMessage}
                            disabled={isSendingMessage || isClosingTicket}
                            handleFilesSelected={handleFilesSelected}
                            isScanning={isScanning}
                        />
                    )}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4 w-full space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Selected Files</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFiles([])}
                                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                >
                                    Clear all
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedFiles.map((file) => {
                                    const FileIcon = getFileIcon(file.type);
                                    return (
                                        <div
                                            key={file.name}
                                            className="group relative flex items-center gap-2 rounded-md border p-2 pr-8 hover:bg-muted/50"
                                        >
                                            {isScanning ? (
                                                <Shield className="h-4 w-4 animate-pulse text-muted-foreground" />
                                            ) : (
                                                <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                                onClick={() => {
                                                    setSelectedFiles(files => 
                                                        files.filter(f => f.name !== file.name)
                                                    );
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}

function QuestionsAndAnswers({ ticket }: { ticket: Ticket }) {
    const parsedContent = useMemo(() => {
        return Object.entries((ticket.content as Record<string, unknown>) ?? {}).reduce((acc, [key, value]) => {
            const [fieldKey, fieldType] = key.split('--');
            acc[fieldKey] = { value, type: fieldType || 'string' };
            return acc;
        }, {} as Record<string, { value: any, type: string }>);
    }, [ticket.content]);

    const formatKey = (key: string): string => {
        return key
            .split('_')
            .join(' ')
            .replace(/^\w/, c => c.toUpperCase());
    }

    return (
        <div className="space-y-4 bg-muted/25 mb-8 p-4 mr-4 rounded-md">
            {Object.entries(parsedContent).map(([key, { value, type }]: [string, { value: any, type: string }]) => (
                <div key={key} className="space-y-2 normal-case">
                    <h3 className="font-medium ">{formatKey(key)}</h3>
                    <div className="text-sm text-muted-foreground">
                        <DisplayValue value={value} type={type} />
                    </div>
                </div>
            ))}
        </div>
    )
}

const DisplayValue = ({ value, type }: { value: any, type: string }) => {
    const formatValue = (value: any): string => {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        return value.toString();
    }
    if (type === 'server' || type === 'server-grid') {
        return <DisplayServer serverId={value} />
    }
    if (type === 'players-grid') {
        return <DisplayPlayer playerIds={value} />
    }
    return <div>{formatValue(value)}</div>
}

const DisplayServer = ({ serverId }: { serverId: string }) => {
    const { data: categories } = useServers();
    const serverName = useMemo(() => {
        let server = undefined;
        const category = categories?.find(c => c.servers.find(s => s.server_id === serverId));
        if (category) {
            server = category.servers.find(s => s.server_id === serverId);
        }
        return server?.server_name || serverId;
    }, [categories, serverId]);
    return <div>{serverName}</div>
}

const DisplayPlayer = ({ playerIds }: { playerIds: string[] }) => {
    const { data: players } = useQuery({
        queryKey: ['admin-player-search', playerIds.join(',')],
        queryFn: async () => {
            const res = await fetch(`/api/players?ids=${playerIds.join(',')}`);
            return res.json();
        }
    })
    if (players) {
        return (
            <div className="flex flex-wrap gap-2">
                {players.map((p: any) => (
                    <div key={p.steam_id} className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                        <Avatar>
                            <AvatarImage src={p.user ? p.user.image : p.avatar} />
                            <AvatarFallback>{p.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{p.username}</span>
                            <span className="text-xs text-muted-foreground">{p.steam_id}</span>
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    return <div>{playerIds.join(', ')}</div>
}

function TicketSkeleton() {
    return (
        <div className="container mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Tickets
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <div className="flex gap-10">
                        <div className="flex flex-col items-start">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex flex-col items-start">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-28" />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 pr-2">
                    <MessageListSkeleton />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-24 w-full" />
                </CardFooter>
            </Card>
        </div>
    )
}

function getFileIcon(fileType: string) {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType.startsWith('video/')) return Film;
    if (fileType.startsWith('audio/')) return Music;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return FileArchive;
    return FileText;
}
