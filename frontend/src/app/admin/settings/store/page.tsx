import { Metadata } from 'next'
import { StoreSettings } from '@/components/admin/store-settings'

export const metadata: Metadata = {
    title: 'Store Settings',
    description: 'Manage store settings.',
}

export default function StoreSettingsPage() {
    return (
        <div className="space-y-6 py-6">
            <h1 className="text-3xl font-bold mb-6">Store Settings</h1>
            <StoreSettings />
        </div>
    )
} 