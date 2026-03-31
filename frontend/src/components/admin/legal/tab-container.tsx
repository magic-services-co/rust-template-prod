"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQueryState } from "nuqs";
import React from "react";
import { TermsOfServiceSettings } from "./terms-of-service-settings";
import { PrivacyPolicySettings } from "./privacy-policy-settings";

interface TabOption {
    key: string;
    label: string;
    component: React.ReactNode;
}

const tabOptions = [
    { key: "terms_of_service", label: "Terms of Service", component: <TermsOfServiceSettings /> },
    { key: "privacy_policy", label: "Privacy Policy", component: <PrivacyPolicySettings /> },
];

export function TabContainer() {
    const [activeTab, setActiveTab] = useQueryState<string>("tab", {
        defaultValue: tabOptions[0].key,
        parse: (value): string =>
            tabOptions.some(tab => tab.key === value) ? value : tabOptions[0].key,
        serialize: (value) => value,
    });

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabOptions.length}, minmax(0, 1fr))` }}>
                {tabOptions.map((tab: TabOption) => (
                    <TabsTrigger key={tab.key} value={tab.key} className="capitalize">
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {tabOptions.map((tab) => (
                <TabsContent key={tab.key} value={tab.key}>
                    {tab.component}
                </TabsContent>
            ))}
        </Tabs>
    );
} 