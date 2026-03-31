import { TicketView } from '@/components/admin/tickets/view/view-ticket'
import { getServerSession } from '@/lib/get-server-session'
import { Suspense } from 'react'
import { Metadata } from 'next'
import { hasPermission, type RoleLike } from '@/lib/permissions/permissions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { User } from 'next-auth'

export const metadata: Metadata = {
    title: 'Ticket View',
    description: 'View a ticket.',
}

export default async function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession()
    if (!session?.user?.roles || !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, { resource: 'tickets', action: 'read' }))) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 h-full">
                <h1 className="text-xl font-bold text-muted-foreground">You do not have permission to view this ticket.</h1>
                <Button variant={"secondary"}>
                    <Link href="/admin">Go to admin dashboard</Link>
                </Button>
            </div>
        )
    }
    return (
        <Suspense>
            <TicketView
                ticketId={parseInt(id)}
                currentUser={session!.user as unknown as User}
            />
        </Suspense>
    )
}
