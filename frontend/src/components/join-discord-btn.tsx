"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
import Link from "next/link";
import { DiscordIcon } from "./icons";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { VariantProps } from "class-variance-authority";

export function JoinDiscordBtn({
    variant = "default",
    theme,
    id
}: {
    variant?: VariantProps<typeof buttonVariants>["variant"];
    theme?: {
        secondaryButtonBg?: string;
        secondaryButtonHover?: string;
        secondaryButtonText?: string;
    } | null;
    id?: string;
}) {
    const { data: settings, isLoading } = useSiteSettings();

    return (
        <Link
            id={id}
            href={settings?.discordInvite ?? ""}
            target="_blank"
            className={cn(
                buttonVariants({
                    size: "lg",
                    variant: variant
                }),
                "group transition-colors duration-200"
            )}
            style={{
                backgroundColor: theme?.secondaryButtonBg || "#fff",
                color: theme?.secondaryButtonText || "#1e293b"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme?.secondaryButtonHover || "#f3f4f6";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme?.secondaryButtonBg || "#fff";
            }}
        >
            <DiscordIcon className="group-hover:rotate-[360deg] duration-700 mr-2.5 h-5 w-5" />
            Join Discord
        </Link>
    )
}