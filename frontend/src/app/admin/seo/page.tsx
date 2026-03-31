import { PagesSeoFormSkeleton } from "@/components/admin/seo/page-seo-skeleton";
import { TabContainer } from "@/components/admin/seo/tab-container";
import { Suspense } from "react";
import { Metadata } from 'next'
import { getServerSession } from "@/lib/get-server-session";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { hasPermission, type RoleLike } from "@/lib/permissions/permissions";

export const metadata: Metadata = {
    title: 'SEO Management',
    description: 'Manage SEO settings.',
}

export default async function SeoPage() {
    const session = await getServerSession()
    if (!session?.user?.roles || !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, { resource: 'seo', action: 'manage' }))) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 h-full">
                <h1 className="text-xl font-bold text-muted-foreground">You do not have permission to manage SEO.</h1>
                <Button variant={"secondary"}>
                    <Link href="/admin">Go to admin dashboard</Link>
                </Button>
            </div>
        )
    }
    return (
        <>
            <h1 className="text-2xl font-bold mb-4">SEO Management</h1>
            <Suspense fallback={<PagesSeoFormSkeleton />}>
                <TabContainer />
            </Suspense>
        </>
    )
}