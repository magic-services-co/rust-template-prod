'use client'

import { useSearchParams } from 'next/navigation'
import { useQueryState } from 'nuqs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ConnectedAccounts from './connected-accounts'
import Transactions from './transactions'
import Subscriptions from './subscriptions'
import { UserSession } from '@/types/next-auth'
import Tickets from './tickets'
import { useProfileTheme } from '@/hooks/use-profile-theme'
import { withUserDefaults } from '@/lib/user-theme-defaults'
import { UserBanStatus } from '@/components/bans/user-ban-status'

interface ProfileTabsProps {
    user: UserSession;
    serverTheme?: any;
}

export function ProfileTabs({ user, serverTheme }: ProfileTabsProps) {
    const { data: clientTheme } = useProfileTheme();
    
    const theme = withUserDefaults(clientTheme || serverTheme);
    
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'connected-accounts'
    const [activeTab, setActiveTab] = useQueryState('tab', {
        defaultValue: defaultTab,
        parse: (value) => ['connected-accounts', 'tickets', 'transactions', 'subscriptions', 'ban-status'].includes(value) ? value : 'connected-accounts',
    })

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList 
                className="flex flex-wrap md:flex-nowrap h-auto w-full grid-cols-4 backdrop-blur"
                style={{
                    backgroundColor: theme.tabsBackground,
                    border: `1px solid ${theme.tabsBorder}`,
                    borderRadius: theme.cardBorderRadius
                }}
            >
                <TabsTrigger 
                    value="connected-accounts" 
                    className="flex-grow py-2.5 transition-all duration-200"
                    style={{
                        color: activeTab === 'connected-accounts' ? theme.tabActiveText : theme.tabInactiveText,
                        backgroundColor: activeTab === 'connected-accounts' ? theme.tabActiveBackground : theme.tabInactiveBackground,
                        borderRadius: theme.buttonBorderRadius
                    }}
                >
                    Connected Accounts
                </TabsTrigger>
                <TabsTrigger 
                    value="tickets" 
                    className="flex-grow py-2.5 transition-all duration-200"
                    style={{
                        color: activeTab === 'tickets' ? theme.tabActiveText : theme.tabInactiveText,
                        backgroundColor: activeTab === 'tickets' ? theme.tabActiveBackground : theme.tabInactiveBackground,
                        borderRadius: theme.buttonBorderRadius
                    }}
                >
                    Tickets
                </TabsTrigger>
                <TabsTrigger 
                    value="transactions" 
                    className="flex-grow py-2.5 transition-all duration-200"
                    style={{
                        color: activeTab === 'transactions' ? theme.tabActiveText : theme.tabInactiveText,
                        backgroundColor: activeTab === 'transactions' ? theme.tabActiveBackground : theme.tabInactiveBackground,
                        borderRadius: theme.buttonBorderRadius
                    }}
                >
                    Transactions
                </TabsTrigger>
                <TabsTrigger 
                    value="subscriptions" 
                    className="flex-grow py-2.5 transition-all duration-200"
                    style={{
                        color: activeTab === 'subscriptions' ? theme.tabActiveText : theme.tabInactiveText,
                        backgroundColor: activeTab === 'subscriptions' ? theme.tabActiveBackground : theme.tabInactiveBackground,
                        borderRadius: theme.buttonBorderRadius
                    }}
                >
                    Subscriptions
                </TabsTrigger>
                <TabsTrigger 
                    value="ban-status" 
                    className="flex-grow py-2.5 transition-all duration-200"
                    style={{
                        color: activeTab === 'ban-status' ? theme.tabActiveText : theme.tabInactiveText,
                        backgroundColor: activeTab === 'ban-status' ? theme.tabActiveBackground : theme.tabInactiveBackground,
                        borderRadius: theme.buttonBorderRadius
                    }}
                >
                    Ban Status
                </TabsTrigger>
            </TabsList>
            <TabsContent value="connected-accounts">
                <ConnectedAccounts user={user} serverTheme={theme} />
            </TabsContent>
            <TabsContent value="tickets">
                <Tickets serverTheme={theme} />
            </TabsContent>
            <TabsContent value="transactions">
                <Transactions serverTheme={theme} />
            </TabsContent>
            <TabsContent value="subscriptions">
                <Subscriptions serverTheme={theme} />
            </TabsContent>
            <TabsContent value="ban-status">
                {user.id ? <UserBanStatus userId={user.id} serverTheme={theme} /> : null}
            </TabsContent>
        </Tabs>
    )
}