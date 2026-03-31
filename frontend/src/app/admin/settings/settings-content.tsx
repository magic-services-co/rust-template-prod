"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SiteSettingsForm } from '@/components/admin/site-settings-form'
import { DiscordIntegrationForm } from '@/components/admin/settings/discord-integration-form'
import { BattleMetricsIntegrationForm } from '@/components/admin/settings/battlemetrics-integration-form'
import { PermissionList } from '@/components/admin/permissions/permission-list'
import { useQueryState } from "nuqs";
import { StoreSettings } from "@/components/admin/store-settings";
import { NavigationForm } from "@/components/admin/navigation-form";
import { RedirectsForm } from "@/components/admin/forms/redirects-form";

const settingsTabs = [
    { id: 'site-settings', label: 'Site Settings', component: SiteSettingsForm },
    { id: 'navigation', label: 'Navigation', component: NavigationForm },
    { id: 'redirects', label: 'Redirects', component: RedirectsForm },
    { id: 'store-settings', label: 'Store Settings', component: StoreSettings },
    { id: 'discord-integration', label: 'Discord Integration', component: DiscordIntegrationForm },
    { id: 'battlemetrics-integration', label: 'BattleMetrics Integration', component: BattleMetricsIntegrationForm },
    { id: 'permissions', label: 'Roles', component: PermissionList },
]

export default function SettingsContent() {
    const [activeTab, setActiveTab] = useQueryState('tab', {
        defaultValue: 'site-settings',
        parse: (value) => ['site-settings', 'navigation', 'redirects', 'store-settings', 'discord-integration', 'battlemetrics-integration', 'permissions'].includes(value) ? value : 'site-settings',
    })
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full overflow-x-auto">
                <TabsList className="w-full min-w-max">
                    {settingsTabs.map(tab => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="whitespace-nowrap"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            {settingsTabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id}>
                    <tab.component />
                </TabsContent>
            ))}
        </Tabs>
    )
}