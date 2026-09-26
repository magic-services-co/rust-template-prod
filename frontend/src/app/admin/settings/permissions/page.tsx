import { Metadata } from 'next'
import { PermissionList } from '@/components/admin/permissions/permission-list'

export const metadata: Metadata = {
    title: 'Roles',
    description: 'Manage roles and permissions.',
}

export default function RolesSettingsPage() {
    return (
        <div className="h-[calc(100svh-7rem)] min-h-0 overflow-hidden">
            <PermissionList />
        </div>
    )
} 