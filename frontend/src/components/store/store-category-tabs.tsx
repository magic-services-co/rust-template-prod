"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useNavlinks } from "@/hooks/store/use-storefront";
import { cn } from "@/lib/utils";
import { withStoreDefaults } from "@/lib/layout-theme-defaults";

function scrollActiveTab(scroller: HTMLElement, behavior: ScrollBehavior) {
    const active = scroller.querySelector(".store-tab-active");
    if (!(active instanceof HTMLElement)) return;
    const left = active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2;
    const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const target = Math.max(0, Math.min(left, max));
    if (Math.abs(target - scroller.scrollLeft) < 2) return;
    scroller.scrollTo({ left: target, behavior });
}

export default function StoreCategoryTabs({ theme }: { theme?: Record<string, unknown> }) {
    const t = withStoreDefaults(theme);
    const { data: tabs } = useNavlinks();
    const pathname = usePathname();
    const scrollerRef = useRef<HTMLDivElement>(null);
    const readyRef = useRef(false);

    const activeSlug = pathname.replace(/^\/store\/?/, "").split("/").filter(Boolean)[0];
    const activeTop = !activeSlug
        ? tabs[0]
        : tabs.find((link) => link.tag_slug === activeSlug) ?? tabs[0];

    useLayoutEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller || tabs.length === 0) return;
        const behavior = readyRef.current ? "smooth" : "auto";
        readyRef.current = true;
        scrollActiveTab(scroller, behavior);
    }, [activeTop?.tag_slug, tabs.length]);

    if (tabs.length === 0) return null;

    return (
        <div
            ref={scrollerRef}
            className="store-tab-scroller flex min-w-0 max-w-full gap-1 overflow-x-auto border p-1"
            style={{
                backgroundColor: t.categoryCardBackground,
                borderColor: t.categoryCardBorder,
                ["--store-tab-inactive" as string]: t.tabInactiveText,
                ["--store-tab-active-text" as string]: t.tabActiveText,
                ["--store-tab-active-bg" as string]: t.tabActiveBackground,
            }}
        >
            {tabs.map((link, tabIndex) => {
                const isActive = activeTop?.tag_slug === link.tag_slug;
                const href = tabIndex === 0 ? "/store" : `/store/${link.tag_slug}`;
                return (
                    <Link
                        key={link.node_id}
                        href={href}
                        scroll={false}
                        prefetch
                        className={cn(
                            "ghost shrink-0 whitespace-nowrap px-4 py-2 text-center text-[10px] font-bold tracking-[1.4px]",
                            isActive ? "store-tab-active" : "store-tab"
                        )}
                    >
                        {link.name.toUpperCase()}
                    </Link>
                );
            })}
        </div>
    );
}
