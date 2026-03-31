import { getProducts } from "@/app/actions/store";
import StoreContent from '@/components/store/store-content';
import StoreContentTabsLeft from '@/components/store/store-content-tabs-left';
import StoreContentAllPacks from '@/components/store/store-content-all-packs';
import { backendApi } from "@/lib/api";
import { getMetadata } from "@/lib/metadata";
import { parsePageTheme } from "@/lib/parse-page-theme";
import { headers } from "next/headers";
import { Suspense } from "react";

type StorePageTheme = { store?: { layoutPreset?: string; [key: string]: unknown } };

export const revalidate = 300;

export async function generateMetadata() {
  return await getMetadata('store');
}

export default async function StorePage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug } = await params;
    const headersList = await headers();
    const siteRes = await fetch(backendApi("data?include=siteSettings"), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const siteData = siteRes.ok ? await siteRes.json() : {};
    const siteSettings = siteData.siteSettings;
    const showAdaptive = (siteSettings as { showAdaptiveCurrencyOnStorefront?: boolean } | null)?.showAdaptiveCurrencyOnStorefront !== false;

    const options: { countryCode?: string } = {};
    if (showAdaptive) {
        const country =
            headersList.get("x-vercel-ip-country") ||
            headersList.get("cf-ipcountry") ||
            headersList.get("cloudfront-viewer-country");
        const code = country?.toUpperCase();
        if (code && /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1") {
            options.countryCode = code;
        }
    }

    const pageRes = await fetch(backendApi("data?include=pageTheme:store"), { headers: { Accept: "application/json" }, next: { revalidate: 60 } });
    const pageData = pageRes.ok ? await pageRes.json() : {};
    const pageTheme = pageData.pageTheme;
    const products = await getProducts(Object.keys(options).length ? options : undefined);

    const theme: StorePageTheme = (parsePageTheme(pageTheme && "settings" in pageTheme ? pageTheme.settings : undefined) || {}) as StorePageTheme;
    const layoutPreset = theme?.store?.layoutPreset || 'default';
    
    return (
        <Suspense fallback={<div>Loading...</div>}>
            {layoutPreset === 'tabs-left' ? (
                <StoreContentTabsLeft 
                    initialProducts={products.data} 
                    params={{ slug: slug || [] }}
                    theme={theme?.store}
                />
            ) : layoutPreset === 'all-packs' ? (
                <StoreContentAllPacks 
                    initialProducts={products.data} 
                    theme={theme?.store}
                />
            ) : (
                <StoreContent 
                    initialProducts={products.data} 
                    params={{ slug: slug || [] }}
                    theme={theme?.store}
                />
            )}
        </Suspense>
    );
}