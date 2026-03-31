import { Metadata } from 'next'
import { NavigationForm } from '@/components/admin/navigation-form'

export const metadata: Metadata = {
    title: 'Navigation Settings',
    description: 'Manage site navigation.',
}

export default function NavigationSettingsPage() {
    return (
        <div className="space-y-6 py-6">
            <h1 className="text-3xl font-bold mb-6">Navigation Settings</h1>
            <NavigationForm />
        </div>
    )
} 