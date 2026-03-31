import { Metadata } from 'next'
import { Suspense } from 'react'
import { hasPermission, type RoleLike } from '@/lib/permissions/permissions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getServerSession } from '@/lib/get-server-session'
import { BattleMetricsIntegrationForm } from '@/components/admin/settings/battlemetrics-integration-form'

export const metadata: Metadata = {
    title: 'BattleMetrics Integration',
    description: 'Manage BattleMetrics integration settings.',
}

export default async function BattleMetricsSettingsPage() {
    const session = await getServerSession()
    if (!session?.user?.roles || !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, { resource: 'settings', action: 'manage' }))) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 h-full">
                <h1 className="text-xl font-bold text-muted-foreground">You do not have permission to manage BattleMetrics integration settings.</h1>
                <Button variant={"secondary"}>
                    <Link href="/admin">Go to admin dashboard</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 py-6">
            <h1 className="text-3xl font-bold mb-6">BattleMetrics Integration</h1>
            <Suspense>
                <BattleMetricsIntegrationForm />
            </Suspense>
        </div>
    )
}
