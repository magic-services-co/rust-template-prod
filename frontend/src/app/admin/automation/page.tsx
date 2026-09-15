import { AutomationList } from '@/components/admin/automation/automation-list'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/get-server-session'
import { hasPermission, type RoleLike } from '@/lib/permissions/permissions'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Automation',
    description: 'Automate server wipes, commands, and map vote results.',
}

export default async function AdminAutomationPage() {
    const session = await getServerSession()
    const roles = (session?.user?.roles ?? undefined) as RoleLike[] | undefined
    const allowed =
        (await hasPermission(roles, { resource: 'automation', action: 'manage' })) ||
        (await hasPermission(roles, { resource: 'servers', action: 'manage' }))

    if (!session?.user?.roles || !allowed) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 h-full">
                <h1 className="text-xl font-bold text-muted-foreground">
                    You do not have permission to manage automation.
                </h1>
                <Button variant="secondary" asChild>
                    <Link href="/admin">Go to admin dashboard</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Automation</h1>
                <p className="text-muted-foreground mt-1">
                    Run wipe workflows when a map vote ends or on a schedule. Power actions, RCON commands, and winning map startup variables are applied through your linked Pterodactyl server.
                </p>
            </div>
            <AutomationList />
        </div>
    )
}
