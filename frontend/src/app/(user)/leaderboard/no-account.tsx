"use client"

import { cn } from "@/lib/utils"
import { signIn } from "@/lib/laravel-auth-react"

export default function NoAccount() {
    return (
        <div
            className={cn(
                "bg-secondary/15 text-muted-foreground px-4 py-2 rounded-md",
                "hover:bg-secondary/30 transition-colors duration-300 cursor-pointer",
                "mt-2 text-sm"
            )}
            onClick={() => signIn("steam")}
        >
            {"Don't see your account?"}
        </div>
    )
}