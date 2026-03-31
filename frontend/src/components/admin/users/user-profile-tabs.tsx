"use client";

import { User } from '@/types/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryState } from 'nuqs';
import { UserOrders } from "./user-orders";
import { UserSubscriptions } from "./user-subscriptions";
import { UserInventory } from "./user-inventory";
import UserTickets from "./user-tickets";
import UserHistory from "./user-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TAB_KEYS = ['tickets', 'inventory', 'orders', 'subscriptions', 'history'] as const;

function StoreTabPlaceholder({ title }: { title: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    This user does not have a store customer ID yet. It is created when they sign in with Steam and load the site, or when you open their profile.
                </CardDescription>
            </CardHeader>
        </Card>
    );
}

export default function UserProfileTabs({ user }: { user: User }) {
    const [activeTab, setActiveTab] = useQueryState('tab', {
        defaultValue: 'tickets',
        parse: (value) => (TAB_KEYS as readonly string[]).includes(value) ? value : 'tickets',
    });

    const hasStoreId = Boolean(user.storeId && String(user.storeId).trim());

    return (
        <Tabs value={activeTab ?? 'tickets'} onValueChange={(v) => setActiveTab(v)} className="w-full">
            <TabsList className="w-full flex flex-wrap">
                <TabsTrigger value="tickets" className="flex-grow">
                    Tickets
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex-grow">
                    Inventory
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex-grow">
                    Orders
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="flex-grow">
                    Subscriptions
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-grow">
                    History
                </TabsTrigger>
            </TabsList>
            <TabsContent value="tickets" className="mt-4">
                <UserTickets userId={user.id} />
            </TabsContent>
            <TabsContent value="inventory" className="mt-4">
                {hasStoreId ? (
                    <UserInventory customerId={String(user.storeId)} />
                ) : (
                    <StoreTabPlaceholder title="Inventory" />
                )}
            </TabsContent>
            <TabsContent value="orders" className="mt-4">
                {hasStoreId ? (
                    <UserOrders customerId={String(user.storeId)} />
                ) : (
                    <StoreTabPlaceholder title="Orders" />
                )}
            </TabsContent>
            <TabsContent value="subscriptions" className="mt-4">
                {hasStoreId ? (
                    <UserSubscriptions customerId={String(user.storeId)} />
                ) : (
                    <StoreTabPlaceholder title="Subscriptions" />
                )}
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                <UserHistory userId={typeof user.steamId === 'string' ? user.steamId : user.id} />
            </TabsContent>
        </Tabs>
    );
}