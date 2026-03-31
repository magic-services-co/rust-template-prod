"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavigationItem {
    name: string
    href: string
    icon: React.ReactNode
}

interface AdminNavigationProps {
    items: NavigationItem[]
}

export function AdminNavigation({ items }: AdminNavigationProps) {
    const pathname = usePathname()

    return (
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider delayDuration={50}>
                {items.map((item) => (
                    <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                            <Link
                                href={item.href}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8 ${pathname === item.href
                                        ? "bg-accent text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                {item.icon}
                                <span className="sr-only">{item.name}</span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </nav>
    )
}