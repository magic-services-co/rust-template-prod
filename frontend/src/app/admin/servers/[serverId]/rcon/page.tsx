import Link from 'next/link'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/get-server-session'
import { hasPermission, type RoleLike } from '@/lib/permissions/permissions'
import { ServerRconClient } from '@/components/admin/servers/server-rcon-client'

export async function generateMetadata({ params }: { params: Promise<{ serverId: string }> }): Promise<Metadata> {
    const { serverId } = await params
    return {
        title: `RCON · ${serverId}`,
        description: 'RCON settings for this server.',
    }
}

export default async function ServerRconPage({ params }: { params: Promise<{ serverId: string }> }) {
    const { serverId } = await params
    const session = await getServerSession()
    if (
        !session?.user?.roles ||
        !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, {
            resource: 'servers',
            action: 'manage',
        }))
    ) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-6">
                <h1 className="text-xl font-bold text-muted-foreground">You do not have permission to manage servers.</h1>
                <Button variant="secondary" asChild>
                    <Link href="/admin">Go to admin dashboard</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
                <Link href="/admin/servers">← Back to server management</Link>
            </Button>
            <ServerRconClient serverId={serverId} />
        </div>
    )
}
