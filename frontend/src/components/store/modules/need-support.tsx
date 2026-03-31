"use client";

import { DiscordIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useSiteSettings } from "@/hooks/use-site-settings";

export default function NeedSupport({ theme }: { theme?: any }) {
    const { data: settings } = useSiteSettings()
    return (
        <div 
            className="backdrop-blur p-4 rounded-md space-y-4"
            style={{
                backgroundColor: theme?.sidebarBackground || 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${theme?.sidebarBorder || 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: theme?.cardBorderRadius || '0.375rem',
                padding: theme?.cardPadding || '1rem'
            }}
        >
            <div className="space-y-2">
                <h3 
                    className="text-2xl font-semibold flex gap-2.5 items-center"
                    style={{ color: theme?.sidebarTitleColor || '#ffffff' }}
                >
                    <InfoIcon className="text-muted" />
                    Need Support?
                </h3>
                <p 
                    className="text-sm"
                    style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                >
                    Having difficulties purchasing a product? or needing general server side support, contact us on our Discord below
                </p>
            </div>
            <Link
                href={settings?.discordInvite ?? ""}
                target="_blank"
                className="w-full group inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                style={{
                    backgroundColor: theme?.buttonPrimaryBackground || '#3b82f6',
                    color: theme?.buttonPrimaryText || '#ffffff',
                    borderRadius: theme?.buttonBorderRadius || '0.375rem'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBackground || '#2563eb';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBackground || '#3b82f6';
                }}
            >
                <DiscordIcon className="group-hover:rotate-[360deg] duration-700 mr-2.5 h-5 w-5" />
                Contact Us
            </Link>
        </div>
    )
}