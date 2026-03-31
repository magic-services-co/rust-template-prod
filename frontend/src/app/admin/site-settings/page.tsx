import { Metadata } from 'next'
import { Suspense } from 'react'
import { hasPermission, type RoleLike } from '@/lib/permissions/permissions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getServerSession } from '@/lib/get-server-session'
import SettingsContent from '../settings/settings-content'

export const metadata: Metadata = {
    title: 'Site Settings',
    description: 'Manage site settings.',
}

export default async function SiteSettingsPage() {
    const session = await getServerSession()
    if (!session?.user?.roles || !(await hasPermission((session?.user?.roles ?? undefined) as RoleLike[] | undefined, { resource: 'settings', action: 'manage' }))) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p className="text-muted-foreground mb-4">You don&apos;t have permission to access this page.</p>
                <Button asChild>
                    <Link href="/admin">Return to Dashboard</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-3xl font-bold mb-6">Site Settings</h1>
            <Suspense fallback={<div>Loading...</div>}>
                <SettingsContent />
            </Suspense>
        </div>
    )
}