"use client";

import { UserNav } from "@/components/nav/user-nav";
import { MainNav } from "@/components/nav/main-nav";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import MobileNav from "./mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { NavigationItem } from "@/types/navigation";

export default function Navigation({ navigationItems, theme }: { navigationItems: NavigationItem[], theme?: { navLinkColor?: string; navLinkHoverColor?: string; navLinkActiveColor?: string; logoImage?: string; } }) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (
        <header className={cn(
            "fixed z-10 w-full py-2.5",
            { "bg-gradient-to-b from-background backdrop-blur": isScrolled }

        )}>
            <div className="container hidden md:flex py-2 items-center justify-between">
                <Link href={"/"} className="hover:scale-110 duration-300">
                    <Image
                        src={theme?.logoImage || "/images/logo.png"}
                        alt="Server Logo"
                        width={60}
                        height={60}
                        className="w-[60px] h-[60px]"
                    />
                </Link>
                <MainNav items={navigationItems} theme={theme} />
                <div className="flex items-center gap-4">
                    <UserNav />
                </div>
            </div>
            <div className="container md:hidden py-2 flex justify-between">
                <MobileNav items={navigationItems} logoImage={theme?.logoImage} />
            </div>
        </header>
    )
}