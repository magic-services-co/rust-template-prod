import { TicketView } from "@/components/tickets/view-ticket"
import { backendApi } from "@/lib/api"
import { getMetadata } from "@/lib/metadata"
import { getServerSession } from "@/lib/get-server-session"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import type { User } from "next-auth"

export async function generateMetadata() {
  return await getMetadata('ticket');
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession()
    if (!session?.user) {
        return redirect('/link')
    }
    const { id } = await params;
    const cookieStore = await cookies();
    const ticketRes = await fetch(backendApi(`tickets/check?id=${encodeURIComponent(id)}`), {
        headers: { Accept: "application/json", Cookie: cookieStore.toString() },
        cache: "no-store",
    });
    const allowed = ticketRes.ok && (await ticketRes.json())?.allowed === true;
    if (!allowed) {
        return redirect('/support')
    }
    return (
        <div className="container pt-40">
            {/* <div className="flex flex-col items-center pb-8 text-center">
                <h2 className="mt-2 text-center text-4xl font-bold">User Ticket</h2>
                <p className="max-w-[80ch] bg-transparent px-8 text-center leading-8 text-black/60 lg:px-0 dark:text-white/50">
                    View your ticket.
                </p>
            </div> */}
            {/* <div className="pb-5">
                <Suspense>
                <DynamicBreadcrumbs />
            </Suspense>
            </div> */}
            <TicketView
                ticketId={parseInt(id)}
                currentUser={session.user as unknown as User}
            />
        </div>
    )
}