"use client";

import { ReactNode } from "react";
import Footer from "@/components/footer";
import Navigation from "@/components/nav/nav";
import { NavigationItem } from "@/types/navigation";

type LayoutTheme = {
  navLinkColor?: string;
  navLinkHoverColor?: string;
  navLinkActiveColor?: string;
  logoImage?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
};

export function UserLayoutClient({
  children,
  navItems,
  theme,
}: {
  children: ReactNode;
  navItems: NavigationItem[];
  theme: LayoutTheme | undefined;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation
        navigationItems={navItems}
        theme={{
          navLinkColor: theme?.navLinkColor,
          navLinkHoverColor: theme?.navLinkHoverColor,
          navLinkActiveColor: theme?.navLinkActiveColor,
          logoImage: theme?.logoImage,
        }}
      />
      <main className="flex-1 text-foreground">
        {children ?? null}
      </main>
      <Footer />
      <div
        className="fixed z-[-2] inset-0 max-w-screen max-h-screen w-screen h-screen bg-cover"
        style={{
          backgroundImage: `url('${theme?.backgroundImage || "/images/background.jpg"}')`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          opacity: (theme?.backgroundOpacity ?? 10) / 100,
        }}
      />
    </div>
  );
}
