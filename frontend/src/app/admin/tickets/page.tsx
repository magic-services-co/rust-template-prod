import { Suspense } from 'react'
import { Metadata } from 'next'
import TicketTable from './ticket-table'
import { Button } from '@/components/ui/button'
import { getServerSession } from '@/lib/get-server-session'
import { hasPermission, type RoleLike } from '@/lib/permissions/permissions'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Ticket Management',
    description: 'Manage support tickets.',
}

export default async function TicketsPage() {
    const session = await getServerSession()
    if (!session?.user?.roles || !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, { resource: 'tickets', action: 'read' }))) {
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
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Ticket Management</h1>
            <Suspense fallback={<div>Loading tickets...</div>}>
                <TicketTable />
            </Suspense>
        </div>
    )
}
