import { CategoryManager } from '@/components/admin/ticket-settings/category-manager'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { hasPermission, type RoleLike } from '@/lib/permissions/permissions'
import Link from 'next/link'
import { getServerSession } from '@/lib/get-server-session'
export const metadata: Metadata = {
    title: 'Ticket Settings',
    description: 'Manage ticket settings.',
}

export default async function TicketSettingsPage() {
    const session = await getServerSession()
    if (!session?.user?.roles || !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, { resource: 'tickets', action: 'manage' }))) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 h-full">
                <h1 className="text-xl font-bold text-muted-foreground">You do not have permission to manage tickets.</h1>
                <Button variant={"secondary"}>
                    <Link href="/admin">Go to admin dashboard</Link>
                </Button>
            </div>
        )
    }
    return (
        <Suspense>
            <CategoryManager />
        </Suspense>
    )
}
