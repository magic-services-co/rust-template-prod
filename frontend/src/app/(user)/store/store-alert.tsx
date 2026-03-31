"use client";

import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { backendApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { AlertCircleIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export default function StoreAlert({ theme }: { theme?: any }) {

    const { data: data, isLoading, isError, error } = useQuery({
        queryKey: ['storeSale'],
        queryFn: async () => {
            const response = await fetch(backendApi("admin/store-sale"), { credentials: "include" })
            if (!response.ok) {
                throw new Error("Failed to fetch store sale data")
            }
            return response.json()
        },
    })

    if (isLoading || isError || !data || !data.enabled) {
        return null
    }

    return (
        data.url ? (
            <Link href={data.url}>
                <StoreAlertContent data={data} theme={theme} />
            </Link>
        ) : (
            <StoreAlertContent data={data} theme={theme} />
        )
    )
}

function StoreAlertContent({ data, theme }: { data: any; theme?: any }) {
    return (
        <Alert 
            className="relative cursor-pointer overflow-hidden backdrop-blur group"
            style={{
                backgroundColor: theme?.sidebarBackground || 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${theme?.sidebarBorder || 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: theme?.cardBorderRadius || '0.375rem'
            }}
        >
            <div className="-z-10 opacity-5 absolute -left-6 -top-6 group-hover:scale-95 duration-700">
                <AlertCircleIcon 
                    className="h-36 w-36" 
                    style={{ color: theme?.subtitleColor || '#ffffff' }}
                />
            </div>
            <AlertTitle 
                className="text-lg ml-2.5"
                style={{ color: theme?.sidebarTitleColor || '#ffffff' }}
            >
                {data?.title}
            </AlertTitle>
            <AlertDescription className="ml-2.5">
                <span 
                    style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                >
                    {data?.description}
                </span>
            </AlertDescription>
            <div className="hidden md:block absolute right-10 group-hover:right-6 duration-500 top-1/2 -translate-y-1/2">
                <ArrowRightIcon
                    className="h-8 w-8"
                    style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-l from-white/5 h-full w-full"></div>
        </Alert>
    )
}