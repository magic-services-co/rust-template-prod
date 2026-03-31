
import { Metadata } from 'next'
import { LeaderboardTabsForm } from '@/components/admin/leaderboard-tabs-form'
import { LeaderboardColumnsForm } from '@/components/admin/leaderboard-columns-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaderboardSettingsForm } from '@/components/admin/leaderboard-settings-form'
import { getServerSession } from '@/lib/get-server-session'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { hasPermission, type RoleLike } from '@/lib/permissions/permissions'

export const metadata: Metadata = {
    title: 'Leaderboard Management',
    description: 'Manage leaderboard tabs and columns.',
}


export default async function LeaderboardManagementPage() {
    const session = await getServerSession()
    if (!session?.user?.roles || !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, { resource: 'leaderboard', action: 'manage' }))) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 h-full">
                <h1 className="text-xl font-bold text-muted-foreground">You do not have permission to manage servers.</h1>
                <Button variant={"secondary"}>
                    <Link href="/admin">Go to admin dashboard</Link>
                </Button>
            </div>
        )
    }
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Leaderboard Management</h2>
            <Tabs defaultValue="tabs" className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="tabs" className="flex-1">Tabs</TabsTrigger>
                    <TabsTrigger value="columns" className="flex-1">Columns</TabsTrigger>
                    <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="tabs">
                    <LeaderboardTabsForm />
                </TabsContent>
                <TabsContent value="columns">
                    <LeaderboardColumnsForm />
                </TabsContent>
                <TabsContent value="settings">
                    <LeaderboardSettingsForm />
                </TabsContent>
            </Tabs>
        </div>
    )
}