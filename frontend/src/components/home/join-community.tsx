"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { UserIcon } from "lucide-react";
import { backendApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { signIn, useSession } from "@/lib/laravel-auth-react";

type LinkedUser = { id: string; name?: string; image?: string };

export function JoinCommunity() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<LinkedUser[]>([]);

    useEffect(() => {
        fetch(backendApi("linked-users"), { credentials: "include" })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setUsers(Array.isArray(data) ? data : []))
            .catch(() => setUsers([]));
    }, []);

    const avatarItems = Array(85).fill(null).map((_, index) => {
        const user = users[index];
        return (
            <div
                className="group relative rounded-full px-1.5 duration-300 z-[0] hover:z-[50] focus:outline-none focus:duration-0 focus-visible:ring-0 active:scale-105 active:duration-100 lg:py-0.5"
                key={index}
            >
                <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Avatar
                                className={cn(
                                    "h-12 w-12 rounded-2xl group-hover:scale-[1.2] duration-300 group-hover:rounded-[2rem] group-focus:outline-none group-focus:duration-0",
                                    "group-focus-visible:ring-2 group-active:rounded-3xl group-active:duration-100 sm:h-16 sm:w-16 sm:rounded-3xl cursor-pointer"
                                )}
                                onClick={() => {
                                    if (!session || !session.user) {
                                        signIn("steam");
                                    }
                                }}
                            >
                                {user ? (
                                    <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                                ) : (
                                    <AvatarFallback>
                                        <UserIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent className="z-[100]" side="top" align="center" sideOffset={10}>
                            {user ? user.name : "Link Your Account"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    });

    return (
        <div className="hidden flex-1 pb-0 pl-6 xl:block">
            <div className="honeycomboverride ml-auto flex flex-wrap xl:w-[38rem]">
                {avatarItems}
            </div>
        </div>
    );
}