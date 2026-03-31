"use client";

import { cn } from "@/lib/utils";
import Link from "next/link"
import { usePathname } from "next/navigation";
import { NavigationItem } from "@/types/navigation";
import React from "react";

export function MainNav({
  items,
  theme
}: {
  items: NavigationItem[],
  theme?: {
    navLinkColor?: string;
    navLinkHoverColor?: string;
    navLinkActiveColor?: string;
  }
}) {
  const path = usePathname();
  const [hoveredItems, setHoveredItems] = React.useState<Record<number, boolean>>({});

  return (
    <nav className="flex items-center space-x-4 lg:space-x-8">
      {items.map((item, index) => {
        const isActive = item.url === path;
        return (
          <Link
            key={index}
            href={item.url}
            className={cn("text-lg font-normal transition-colors")}
            style={{
              color: isActive
                ? theme?.navLinkActiveColor || "#f2f4f6"
                : hoveredItems[index]
                  ? theme?.navLinkHoverColor || "#f2f4f6"
                  : theme?.navLinkColor || "#a0abbe"
            }}
            onMouseEnter={() => setHoveredItems(prev => ({ ...prev, [index]: true }))}
            onMouseLeave={() => setHoveredItems(prev => ({ ...prev, [index]: false }))}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}