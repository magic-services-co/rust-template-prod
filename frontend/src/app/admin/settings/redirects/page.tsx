import { Metadata } from 'next'
import { RedirectsForm } from '@/components/admin/forms/redirects-form'

export const metadata: Metadata = {
    title: 'Redirects Settings',
    description: 'Manage URL redirects.',
}

export default function RedirectsSettingsPage() {
    return (
        <div className="space-y-6 py-6">
            <h1 className="text-3xl font-bold mb-6">Redirects Settings</h1>
            <RedirectsForm />
        </div>
    )
} 