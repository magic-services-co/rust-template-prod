"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { VariantProps } from "class-variance-authority";

export function StoreButton({ 
    variant = "secondary",
    theme
}: { 
    variant?: VariantProps<typeof buttonVariants>["variant"];
    theme?: {
        primaryButtonBg?: string;
        primaryButtonHover?: string;
        primaryButtonText?: string;
    } | null;
}) {
    return (
        <Link
            id="store-button"
            href={"/store"}
            className={cn(
                buttonVariants({
                    size: "lg",
                    variant: variant
                }),
                "group transition-colors duration-200"
            )}
            style={{
                backgroundColor: theme?.primaryButtonBg || "#1e293b",
                color: theme?.primaryButtonText || "#ffffff"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme?.primaryButtonHover || "#334155";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme?.primaryButtonBg || "#1e293b";
            }}
        >
            <ShoppingBasket className="group-hover:animate-wiggle mr-2.5 h-5 w-5" />
            Visit Store
        </Link>
    )
} 