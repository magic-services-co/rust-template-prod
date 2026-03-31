import { GiftIcon } from "lucide-react";
import StoreAlert from "./store-alert";
import Cart from "@/components/store/cart";
import DynamicBreadcrumbs from "@/components/dynamic-breadcrumbs";
import CheckGiftcardForm from "@/components/forms/check-giftcard-form";
import { Suspense } from "react";
import { CartProvider } from "@/components/context/store-context";
import FeaturedProduct from "@/components/store/modules/featured-product";
import NeedSupport from "@/components/store/modules/need-support";
import { backendApi } from "@/lib/api";
import { withUserDefaults } from "@/lib/user-theme-defaults";
import Script from "next/script";

type StoreLayoutTheme = {
    layoutPreset?: string;
    subtitleColor?: string;
    titleColor?: string;
    sidebarBackground?: string;
    sidebarBorder?: string;
    sidebarTitleColor?: string;
    cardBorderRadius?: string;
    cardPadding?: string;
    [key: string]: unknown;
};

export default async function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const res = await fetch(backendApi("data?include=siteSettings,themeSettings,pageTheme:store"), {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
    });
    const data = res.ok ? await res.json() : {};
    const siteSettings = data.siteSettings;
    const themeSettings = data.themeSettings;
    const pageTheme = data.pageTheme;

    const rawSettings = pageTheme && "settings" in pageTheme ? pageTheme.settings : null;
    const settings = typeof rawSettings === "string" ? (() => { try { return JSON.parse(rawSettings); } catch { return {}; } })() : rawSettings;
    const theme = withUserDefaults(settings && typeof settings === "object" ? (settings as { store?: StoreLayoutTheme }).store : undefined);
    const layoutPreset = theme.layoutPreset ?? "default";
    const showSidebar = layoutPreset === 'default';

    return (
        <CartProvider>
            <Script 
                src="https://cdn.paynow.gg/paynow-js/bundle.js" 
                strategy="afterInteractive"
                defer
            />
            <div className="container pt-40">
                <div className="flex flex-col gap-6 md:gap-0 md:flex-row items-center md:items-end justify-between mb-8">
                    <div className="uppercase text-center md:text-left font-medium">
                        <span 
                            className="text-sm"
                            style={{ color: theme.subtitleColor }}
                        >
                            Welcome to the official
                        </span>
                        <h1 className="text-4xl font-bold">
                            {siteSettings?.name ? (
                                <>
                                    <span style={{ color: theme.titleColor }}>
                                        {siteSettings.name}
                                    </span>
                                    {" Store"}
                                </>
                            ) : (
                                "Magic Rust Template"
                            )}
                        </h1>
                    </div>
                    <Cart theme={theme} />
                </div>
                <div className="grid grid-cols-12 gap-4 w-full">
                    <div className={showSidebar ? "col-span-12 md:col-span-9 w-full flex flex-col gap-4" : "col-span-12 w-full flex flex-col gap-4"}>
                        <StoreAlert theme={theme} />
                        {showSidebar && (
                            <div className="">
                                <Suspense>
                                    <DynamicBreadcrumbs />
                                </Suspense>
                            </div>
                        )}
                        {children}
                    </div>
                    {showSidebar && (
                        <div className="col-span-12 md:col-span-3 w-full space-y-4">
                            <div 
                                className="backdrop-blur p-4 rounded-md space-y-2"
                                style={{
                                    backgroundColor: theme.sidebarBackground,
                                    border: `1px solid ${theme.sidebarBorder}`,
                                    borderRadius: theme.cardBorderRadius,
                                    padding: theme.cardPadding
                                }}
                            >
                                <h3 
                                    className="text-2xl font-semibold flex gap-2.5 items-center"
                                    style={{ color: theme.sidebarTitleColor }}
                                >
                                    <GiftIcon
                                        className="text-muted"
                                    />
                                    Check Giftcard
                                </h3>
                                <CheckGiftcardForm theme={theme} />
                            </div>
                            <FeaturedProduct theme={theme} />
                            <NeedSupport theme={theme} />
                        </div>
                    )}
                </div>
            </div>
        </CartProvider>
    )
}