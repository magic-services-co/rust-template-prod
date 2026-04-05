'use client'

import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Download, AlertCircle, CheckCircle, RefreshCw, Users, Key, Info, Hash } from 'lucide-react'

interface PreviewPlayer {
    playerId: string
    discordUsername: string
    discordId: string
    steamUsername: string
    steamId: string
    status: 'new' | 'update' | 'skip'
}

interface PreviewData {
    total: number
    wouldImport: number
    wouldUpdate: number
    wouldSkip: number
    preview: PreviewPlayer[]
}

interface ImportResult {
    success: boolean
    message: string
    imported: number
    updated: number
    skipped: number
    total: number
    errors?: string[]
}

export function ServyCoreImportDialog() {
    const [open, setOpen] = useState(false)
    const [apiKey, setApiKey] = useState('')
    const [projectId, setProjectId] = useState('')
    const [isConfigured, setIsConfigured] = useState(false)
    const queryClient = useQueryClient()

    const { data: settings, isLoading: isLoadingSettings } = useQuery({
        queryKey: ['servyCoreIntegration'],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/settings/servycore'), { credentials: 'include', headers });
            if (!response.ok) {
                throw new Error('Failed to fetch Servy Core settings')
            }
            return response.json()
        },
        enabled: open,
    })

    const hasCredentials = !!(settings?.enabled && settings?.apiKey && settings?.projectId)

    const { data: previewData, isLoading: isLoadingPreview, error: previewError, refetch: refetchPreview } = useQuery({
        queryKey: ['servyCoreImportPreview'],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/settings/servycore/import'), { credentials: 'include', headers });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(errorData?.error || 'Failed to fetch preview')
            }
            return response.json() as Promise<PreviewData>
        },
        enabled: open && (hasCredentials || isConfigured),
    })

    const saveCredentialsMutation = useMutation({
        mutationFn: async ({ key, project }: { key: string; project: string }) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/settings/servycore'), {
                method: 'PUT',
                credentials: 'include',
                headers,
                body: JSON.stringify({ apiKey: key, projectId: project, enabled: true }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(errorData?.error || 'Failed to save credentials')
            }
            return response.json()
        },
        onSuccess: () => {
            toast.success('Servy Core credentials saved successfully')
            setIsConfigured(true)
            queryClient.invalidateQueries({ queryKey: ['servyCoreIntegration'] })
            queryClient.invalidateQueries({ queryKey: ['servyCoreImportPreview'] })
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to save credentials')
        },
    })

    const testCredentialsMutation = useMutation({
        mutationFn: async ({ key, project }: { key: string; project: string }) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/settings/servycore/test'), {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify({ apiKey: key, projectId: project }),
            });
            if (!response.ok) {
                throw new Error('Failed to test credentials')
            }
            return response.json()
        },
        onSuccess: (data) => {
            if (data.valid) {
                toast.success(`Credentials are valid! ${data.playerCount !== undefined ? `${data.playerCount} players found.` : ''}`)
                saveCredentialsMutation.mutate({ key: apiKey, project: projectId })
            } else {
                toast.error(data.error || 'Invalid credentials')
            }
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to test credentials')
        },
    })

    const importMutation = useMutation({
        mutationFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/settings/servycore/import'), {
                method: 'POST',
                credentials: 'include',
                headers,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(errorData?.error || 'Failed to import users')
            }
            return response.json() as Promise<ImportResult>
        },
        onSuccess: (data) => {
            toast.success(data.message)
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            queryClient.invalidateQueries({ queryKey: ['servyCoreImportPreview'] })
            setOpen(false)
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to import users from Servy Core')
        },
    })

    const getStatusBadge = (status: 'new' | 'update' | 'skip') => {
        switch (status) {
            case 'new':
                return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">New</Badge>
            case 'update':
                return <Badge className="border-zinc-500/30 bg-zinc-500/20 text-zinc-600 dark:text-zinc-300">Update</Badge>
            case 'skip':
                return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">Skip</Badge>
        }
    }

    const showCredentialsForm = !hasCredentials && !isConfigured
    const showPreview = hasCredentials || isConfigured

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
                setApiKey('')
                setProjectId('')
                setIsConfigured(false)
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Import from Servy Core
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Import Users from Servy Core
                    </DialogTitle>
                    <DialogDescription>
                        Import linked Discord and Steam accounts from your Servy Core (formerly Social Link) project.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingSettings ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : showCredentialsForm ? (
                    <div className="space-y-4">
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Enter your Servy Core API key and Project ID to import users. You can get these from the{' '}
                                <a
                                    href="https://servycore.io/panel"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline hover:no-underline"
                                >
                                    Servy Core Panel
                                </a>
                                .
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="projectId">Project ID</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="projectId"
                                        type="text"
                                        placeholder="e.g., 9af2bd7c-0a93-43d4-a54c-a6ba551d5951"
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="apiKey"
                                        type="password"
                                        placeholder="Enter your Servy Core API key"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            
                            <Button
                                onClick={() => testCredentialsMutation.mutate({ key: apiKey, project: projectId })}
                                disabled={!apiKey || !projectId || testCredentialsMutation.isPending || saveCredentialsMutation.isPending}
                                className="w-full"
                            >
                                {testCredentialsMutation.isPending || saveCredentialsMutation.isPending ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Connect'
                                )}
                            </Button>
                        </div>
                    </div>
                ) : isLoadingPreview ? (
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </div>
                ) : previewError ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {(previewError as Error).message}
                        </AlertDescription>
                    </Alert>
                ) : previewData ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="rounded-lg border border-border/15 p-3 text-center">
                                <div className="text-2xl font-bold">{previewData.total}</div>
                                <div className="text-sm text-muted-foreground">Total</div>
                            </div>
                            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center">
                                <div className="text-2xl font-bold text-green-500">{previewData.wouldImport}</div>
                                <div className="text-sm text-green-500/80">New</div>
                            </div>
                            <div className="rounded-lg border border-zinc-500/30 bg-zinc-500/10 p-3 text-center">
                                <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-300">{previewData.wouldUpdate}</div>
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">Update</div>
                            </div>
                            <div className="rounded-lg border border-gray-500/30 bg-gray-500/10 p-3 text-center">
                                <div className="text-2xl font-bold text-gray-500">{previewData.wouldSkip}</div>
                                <div className="text-sm text-gray-500/80">Skip</div>
                            </div>
                        </div>

                        {previewData.preview.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">Preview (first 50 players)</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => refetchPreview()}
                                        disabled={isLoadingPreview}
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </div>
                                <ScrollArea className="h-[300px] rounded-md border border-border/15">
                                    <div className="p-4 space-y-2">
                                        {previewData.preview.map((player) => (
                                            <div
                                                key={player.playerId}
                                                className="flex items-center justify-between rounded-lg border border-border/15 p-3"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium truncate">{player.steamUsername}</span>
                                                        {getStatusBadge(player.status)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        <span className="text-muted-foreground">Discord:</span> {player.discordUsername} ({player.discordId})
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        <span className="text-orange-400">Steam:</span> {player.steamId}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>New:</strong> Creates a new user with linked Discord and Steam accounts.{' '}
                                <strong>Update:</strong> Links missing account to existing user.{' '}
                                <strong>Skip:</strong> User already has both accounts linked.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    {showPreview && (
                        <Button
                            onClick={() => importMutation.mutate()}
                            disabled={isLoadingPreview || importMutation.isPending || !previewData}
                        >
                            {importMutation.isPending ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Import {previewData ? previewData.wouldImport + previewData.wouldUpdate : 0} Users
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
