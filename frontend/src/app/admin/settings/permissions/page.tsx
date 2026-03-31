import { Metadata } from 'next'
import { PermissionList } from '@/components/admin/permissions/permission-list'

export const metadata: Metadata = {
    title: 'Roles',
    description: 'Manage roles and permissions.',
}

export default function RolesSettingsPage() {
    return (
        <div className="space-y-6 py-6">
            <h1 className="text-3xl font-bold mb-6">Roles</h1>
            <PermissionList />
        </div>
    )
} 