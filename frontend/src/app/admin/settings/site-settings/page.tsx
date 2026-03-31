import { Metadata } from 'next'
import { SiteSettingsForm } from '@/components/admin/site-settings-form'

export const metadata: Metadata = {
    title: 'Site Settings',
    description: 'Manage site settings.',
}

export default function SiteSettingsPage() {
    return (
        <div className="space-y-6 py-6">
            <h1 className="text-3xl font-bold mb-6">Site Settings</h1>
            <SiteSettingsForm />
        </div>
    )
} 