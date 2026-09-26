"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import { useSession, signIn, signOut } from "@/lib/laravel-auth-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { LAYOUT_THEME_DEFAULTS } from "@/lib/layout-theme-defaults";

import { NavigationItem } from "@/types/navigation";

export default function MobileNav({
    items,
    logoImage,
    wordmarkColor,
    theme,
}: {
    items: NavigationItem[];
    logoImage?: string;
    wordmarkColor?: string;
    theme?: {
        navLinkColor?: string;
        navLinkActiveColor?: string;
        primaryButtonBg?: string;
        primaryButtonText?: string;
    };
}) {
    const path = usePathname()
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const visible = items.filter((item) => !item.hidden);
    return (
        <>
            <BrandMark logoImage={logoImage} wordmarkColor={wordmarkColor} size="header" />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger>
                    <MenuIcon size={28} />
                </SheetTrigger>
                <SheetContent className="bg-[#05070a]/95 backdrop-blur-md border-border/15">
                    <SheetHeader className="h-full flex">
                        <SheetTitle>
                            <BrandMark logoImage={logoImage} wordmarkColor={wordmarkColor} size="header" />
                        </SheetTitle>
                        <div className="w-full h-full flex flex-col gap-6 justify-between items-start">
                            <nav className="flex-grow flex flex-col items-start pt-8 ml-1 mb-6 space-y-4">
                                {visible.map((item, index) => (
                                    <Link
                                        key={item.id || index}
                                        href={item.url}
                                        className={cn(
                                            "text-xl font-normal text-left transition-colors"
                                        )}
                                        style={{
                                            color: item.url === path
                                                ? theme?.navLinkActiveColor || LAYOUT_THEME_DEFAULTS.navLinkActiveColor
                                                : theme?.navLinkColor || LAYOUT_THEME_DEFAULTS.navLinkColor,
                                        }}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                            <div className="flex flex-col gap-12 w-full">
                                {status === "authenticated" ? (
                                    <Link
                                        href={"/profile"}
                                        className="relative flex items-center gap-2.5 p-0 opacity-75 hover:opacity-100 transition-opacity duration-300"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={typeof session?.user?.image === 'string' ? session.user.image : ''} alt={typeof session?.user?.name === 'string' ? session.user.name : ''} />
                                            <AvatarFallback>{typeof session?.user?.name === 'string' ? session.user.name.charAt(0) : '?'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start">
                                            <span className="text-lg">{typeof session?.user?.name === 'string' ? session.user.name : ''}</span>
                                            <span className="text-muted-foreground text-sm">View profile</span>
                                        </div>
                                    </Link>
                                ) : null}
                                {status === "authenticated" ? (
                                    <Button
                                        size={"lg"}
                                        variant={"destructive"}
                                        className="w-full"
                                        onClick={() => {
                                            setIsOpen(false)
                                            signOut()
                                        }}>
                                        Logout
                                    </Button>
                                ) : (
                                    <button
                                        type="button"
                                        className="flex h-11 w-full items-center justify-center rounded-md text-[15px] font-medium"
                                        style={{
                                            backgroundColor: theme?.primaryButtonBg || LAYOUT_THEME_DEFAULTS.primaryButtonBg,
                                            color: theme?.primaryButtonText || LAYOUT_THEME_DEFAULTS.primaryButtonText,
                                        }}
                                        onClick={() => {
                                            setIsOpen(false)
                                            signIn("steam")
                                        }}>
                                        Sign in
                                    </button>
                                )}
                            </div>
                        </div>
                    </SheetHeader>
                </SheetContent>
            </Sheet>
        </>
    )
}
