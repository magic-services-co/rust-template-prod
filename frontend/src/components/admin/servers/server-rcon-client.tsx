'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ExternalLink, ChevronLeft } from 'lucide-react'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ServerRconDashboard } from '@/components/admin/servers/server-rcon-dashboard'

type AdminServerRconPayload = {
    server_id: string
    server_name: string
    enabled: boolean
    server_address: string | null
    rcon_ip: string | null
    rcon_port: number | null
    rcon_password_configured: boolean
}

export function ServerRconClient({ serverId }: { serverId: string }) {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin-server-rcon', serverId],
        queryFn: async () => {
            const token = getAuthToken()
            const headers: Record<string, string> = { Accept: 'application/json' }
            if (token) headers.Authorization = `Bearer ${token}`
            const res = await fetch(backendApi(`admin/servers/${encodeURIComponent(serverId)}`), {
                credentials: 'include',
                headers,
            })
            if (res.status === 404) {
                throw new Error('Server not found')
            }
            if (!res.ok) {
                throw new Error('Failed to load server')
            }
            return res.json() as Promise<AdminServerRconPayload>
        },
    })

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 w-full max-w-xl" />
            </div>
        )
    }

    if (isError || !data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Could not load server</CardTitle>
                    <CardDescription>{error instanceof Error ? error.message : 'Unknown error'}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const rconReady =
        Boolean(data.rcon_ip?.trim()) &&
        data.rcon_port != null &&
        data.rcon_port > 0 &&
        data.rcon_password_configured

    if (!rconReady) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">{data.server_name}</h1>
                    <p className="text-muted-foreground text-sm">RCON dashboard requires host, port, and password.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={`https://www.battlemetrics.com/servers/rust/${encodeURIComponent(data.server_id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            BattleMetrics
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/servers">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Servers
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>RCON connection</CardTitle>
                        <CardDescription>
                            Set RCON IP, port, and password with Edit on the servers list, then return here for the live panel.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="grid gap-1">
                            <span className="text-muted-foreground">RCON IP</span>
                            <span className="font-mono">{data.rcon_ip?.trim() || '—'}</span>
                        </div>
                        <div className="grid gap-1">
                            <span className="text-muted-foreground">RCON port</span>
                            <span className="font-mono">{data.rcon_port ?? '—'}</span>
                        </div>
                        <div className="grid gap-1">
                            <span className="text-muted-foreground">Password</span>
                            <span>{data.rcon_password_configured ? 'Configured' : 'Not set'}</span>
                        </div>
                        {data.server_address ? (
                            <div className="grid gap-1 border-t pt-2">
                                <span className="text-muted-foreground">Game address (reference)</span>
                                <span className="font-mono">{data.server_address}</span>
                            </div>
                        ) : null}
                        <p className="pt-2 text-amber-600 dark:text-amber-500">
                            RCON is incomplete. Set IP, port, and password under Edit on the servers page.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return <ServerRconDashboard serverId={serverId} siteServerName={data.server_name} />
}
