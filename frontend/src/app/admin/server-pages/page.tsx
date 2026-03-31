import { Metadata } from "next";
import { getServerSession } from "@/lib/get-server-session";
import { hasPermission, type RoleLike } from "@/lib/permissions/permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ServerPagesManager } from "@/components/admin/server-pages/manager";

export const metadata: Metadata = {
    title: "Pages",
    description: "Manage custom pages."
};

export default async function ServerPagesPage() {
    const session = await getServerSession();
    
    if (!session?.user?.roles || !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, { resource: 'servers', action: 'manage' }))) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 h-full">
                <h1 className="text-xl font-bold text-muted-foreground">You do not have permission to manage pages.</h1>
                <Button variant={"secondary"}>
                    <Link href="/admin">Go to admin dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Server Pages</h1>
            </div>
            <ServerPagesManager />
        </div>
    );
}
