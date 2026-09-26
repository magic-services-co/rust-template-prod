"use client";

import DisplayProduct from "@/components/store/product";
import { useNavlinks, useProducts } from "@/hooks/store/use-storefront";
import { NavLink, Product } from "@/types/store";
import { Loader2 } from "lucide-react";
import { useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { withStoreDefaults } from "@/lib/layout-theme-defaults";

interface StoreContentProps {
    params: { slug: string[] };
    initialProducts?: Product[];
    theme?: any;
}

function findNavLinkBySlugPath(navlinks: NavLink[], slugPath: string[]): NavLink | undefined {
    if (slugPath.length === 0) return undefined;
    let currentLevel = navlinks;
    let result: NavLink | undefined;
    for (const slug of slugPath) {
        result = currentLevel.find((link) => link.tag_slug === slug);
        if (!result) return undefined;
        currentLevel = result.children;
    }
    return result;
}

function isTagInNavLinkTree(tag: string, navLink: NavLink): boolean {
    if (navLink.tag_slug === tag) return true;
    return navLink.children.some((child) => isTagInNavLinkTree(tag, child));
}

function isProductEnabled(product: Product) {
    if (!product.enabled_at && !product.enabled_until) return true;
    const now = new Date();
    const enabledAt = product.enabled_at ? new Date(product.enabled_at as string | number | Date) : null;
    const enabledUntil = product.enabled_until ? new Date(product.enabled_until as string | number | Date) : null;
    if (enabledAt && now < enabledAt) return false;
    if (enabledUntil && now > enabledUntil) return false;
    return true;
}

export function categoryAccessLabel(name?: string) {
    const raw = (name || "PACKAGE").trim();
    const upper = raw.toUpperCase();
    if (upper.includes("ACCESS")) return upper;
    const singular = upper.endsWith("S") && upper.length > 3 ? upper.slice(0, -1) : upper;
    return `${singular} ACCESS`;
}

export default function StoreContent({ params, initialProducts, theme }: StoreContentProps) {
    const t = withStoreDefaults(theme);
    const { data: productsData = initialProducts, isLoading: isLoadingProducts, error: productsError } = useProducts();
    const { data: navlinks, isLoading: isLoadingNavlinks } = useNavlinks();
    const searchParams = useSearchParams();
    const router = useRouter();
    const hasData = initialProducts && initialProducts.length > 0;

    useEffect(() => {
        const success = searchParams.get("success");
        if (success === "true") {
            toast.success("Purchase completed successfully! Your roles will be assigned shortly.");
            router.replace("/store", { scroll: false });
        }
    }, [searchParams, router]);

    const tabs = navlinks ?? [];
    const activeTop = useMemo(() => {
        if (!tabs.length) return undefined;
        if (!params.slug || params.slug.length === 0) return tabs[0];
        return tabs.find((link) => link.tag_slug === params.slug[0]) ?? tabs[0];
    }, [tabs, params.slug]);

    const activeCategory = useMemo(() => {
        if (!navlinks || !params.slug || params.slug.length === 0) return activeTop;
        return findNavLinkBySlugPath(navlinks, params.slug) ?? activeTop;
    }, [navlinks, params.slug, activeTop]);

    const products = useMemo<Product[] | undefined>(() => {
        if (!productsData) return undefined;
        const filterCategory = activeCategory;
        return productsData.filter((product: Product) => {
            if (!isProductEnabled(product)) return false;
            if (!filterCategory) return true;
            return (product.tags ?? []).some((tag) =>
                isTagInNavLinkTree((tag as { slug?: string }).slug ?? "", filterCategory)
            );
        });
    }, [productsData, activeCategory]);

    if (isLoadingNavlinks || (!hasData && isLoadingProducts)) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center py-8">
                <Loader2 className="size-10 animate-spin" style={{ color: t.loadingSpinnerColor }} />
                <p className="store-hero-subtitle pt-4 text-sm">Loading store…</p>
            </div>
        );
    }

    if (productsError) {
        return (
            <div className="py-8 text-center">
                <p style={{ color: t.errorTextColor }}>Error loading store content. Please try again later.</p>
            </div>
        );
    }

    const categoryLabel = categoryAccessLabel(activeTop?.name || activeCategory?.name);

    return (
        <div className="flex flex-col">
            {products && products.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((product, index) => (
                        <DisplayProduct
                            key={product.id}
                            product={product}
                            theme={t}
                            index={index}
                            categoryLabel={categoryLabel}
                            hidePurchaseTypeSelector
                        />
                    ))}
                </div>
            ) : (
                <p className="store-hero-subtitle pt-3 text-center text-sm">No products found in this category.</p>
            )}
        </div>
    );
}
