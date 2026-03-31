import { Metadata } from 'next'
import { DiscordIntegrationForm } from '@/components/admin/settings/discord-integration-form'

export const metadata: Metadata = {
    title: 'Discord Integration',
    description: 'Manage Discord integration settings.',
}

export default function DiscordSettingsPage() {
    return (
        <div className="space-y-6 py-6">
            <h1 className="text-3xl font-bold mb-6">Discord Integration</h1>
            <DiscordIntegrationForm />
        </div>
    )
} 