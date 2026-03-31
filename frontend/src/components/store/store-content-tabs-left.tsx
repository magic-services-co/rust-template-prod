"use client";

import DisplayProduct from "@/components/store/product";
import { useNavlinks, useProducts } from "@/hooks/store/use-storefront";
import { cn } from "@/lib/utils";
import { NavLink, Product } from "@/types/store";
import { Loader2, ArrowLeft, GiftIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import CheckGiftcardForm from "@/components/forms/check-giftcard-form";
import NeedSupport from "@/components/store/modules/need-support";

interface StoreContentTabsLeftProps {
    params: { slug: string[] };
    initialProducts?: Product[];
    theme?: any;
}

function findNavLinkBySlugPath(navlinks: NavLink[], slugPath: string[]): NavLink | undefined {
    if (slugPath.length === 0) return undefined;
    
    let currentLevel = navlinks;
    let result: NavLink | undefined;
    
    for (const slug of slugPath) {
        result = currentLevel.find(link => link.tag_slug === slug);
        if (!result) return undefined;
        currentLevel = result.children;
    }
    
    return result;
}

function isTagInNavLinkTree(tag: string, navLink: NavLink): boolean {
    if (navLink.tag_slug === tag) return true;
    return navLink.children.some(child => isTagInNavLinkTree(tag, child));
}

export default function StoreContentTabsLeft({ params, initialProducts, theme }: StoreContentTabsLeftProps) {
    const { data: productsData = initialProducts, isLoading: isLoadingProducts, error: productsError } = useProducts();
    const { data: navlinks, isLoading: isLoadingNavlinks } = useNavlinks();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const hasData = initialProducts && initialProducts.length > 0;

    useEffect(() => {
        const success = searchParams.get('success');
        if (success === 'true') {
            toast.success('Purchase completed successfully! Your roles will be assigned shortly.');
            router.replace('/store', { scroll: false });
        }
    }, [searchParams, router]);

    const activeCategory = useMemo(() => {
        if (!navlinks || !params.slug || params.slug.length === 0) return undefined;
        return findNavLinkBySlugPath(navlinks, params.slug);
    }, [navlinks, params.slug]);

    const products = useMemo<Product[] | undefined>(() => {
        if (!productsData || !navlinks || !params.slug) return undefined;

        if (!activeCategory || activeCategory.children.length > 0) {
            return undefined;
        }

        return productsData.filter((product: Product) => {
            if (product.enabled_at || product.enabled_until) {
                const now = new Date();
                const enabledAt = product.enabled_at ? new Date(product.enabled_at as string | number | Date) : null;
                const enabledUntil = product.enabled_until ? new Date(product.enabled_until as string | number | Date) : null;

                if (enabledAt && now < enabledAt) return false;
                if (enabledUntil && now > enabledUntil) return false;
            }

            return (product.tags ?? []).some(tag => isTagInNavLinkTree((tag as { slug?: string }).slug ?? '', activeCategory!));
        });
    }, [productsData, navlinks, params.slug, activeCategory]);

    if (!hasData && (isLoadingProducts || isLoadingNavlinks)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
                <div className="flex items-center justify-center mb-4">
                    <span
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full"
                        style={{
                            backgroundColor: theme?.sidebarBackground || "rgba(255, 255, 255, 0.1)"
                        }}
                    >
                        <Loader2
                            className="w-12 h-12 animate-spin"
                            style={{
                                color: theme?.loadingSpinnerColor || "#ffffff"
                            }}
                        />
                    </span>
                </div>
                <h2
                    className="text-xl font-semibold mb-2"
                    style={{
                        color: theme?.titleColor || "#ffffff"
                    }}
                >
                    Loading Store
                </h2>
                <p
                    style={{
                        color: theme?.subtitleColor || "#b0b0b0"
                    }}
                >
                    Please wait while we load the products...
                </p>
            </div>
        );
    }

    if (productsError) {
        return (
            <div className="text-center py-8">
                <p style={{ color: theme?.errorTextColor || "#ef4444" }}>
                    Error loading store content. Please try again later.
                </p>
            </div>
        );
    }

    const currentPath = pathname || '/store';
    const categoriesToShow = activeCategory ? activeCategory.children : navlinks;
    const currentSlugPath = params.slug || [];
    
    const parentPath = currentSlugPath.slice(0, -1);
    const backPath = parentPath.length > 0 
        ? `/store/${parentPath.join('/')}`
        : '/store';

    return (
        <div className="grid grid-cols-12 gap-6 w-full">
            <div className="col-span-12 md:col-span-3 space-y-2">
                {activeCategory && (
                    <Link
                        href={backPath}
                        className={cn(
                            "block backdrop-blur p-4 rounded-md transition-all duration-300 mb-2"
                        )}
                        style={{
                            backgroundColor: theme?.categoryCardBackground || "rgba(255, 255, 255, 0.05)",
                            border: `1px solid ${theme?.categoryCardBorder || "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: theme?.cardBorderRadius || "0.375rem",
                            padding: theme?.cardPadding || "1rem",
                            color: theme?.categoryCardTitleColor || "#ffffff",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme?.categoryCardHoverBackground || "rgba(255, 255, 255, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme?.categoryCardBackground || "rgba(255, 255, 255, 0.05)";
                        }}
                    >
                        <span className="text-lg uppercase flex items-center gap-2">
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </span>
                    </Link>
                )}
                {categoriesToShow && categoriesToShow.length > 0 && categoriesToShow.map((link) => {
                    const linkPath = activeCategory
                        ? [...currentSlugPath, link.tag_slug]
                        : [link.tag_slug];
                    const linkPathString = `/store/${linkPath.join('/')}`;
                    const isActive = currentPath === linkPathString || 
                        (currentPath === '/store' && linkPath.length === 1 && currentSlugPath.length === 0);
                    
                    return (
                        <Link
                            href={linkPathString}
                            key={link.node_id}
                            className={cn(
                                "block backdrop-blur p-4 rounded-md transition-all duration-300",
                                isActive && "font-semibold"
                            )}
                            style={{
                                backgroundColor: isActive 
                                    ? (theme?.categoryCardHoverBackground || "rgba(255, 255, 255, 0.1)")
                                    : (theme?.categoryCardBackground || "rgba(255, 255, 255, 0.05)"),
                                border: `1px solid ${theme?.categoryCardBorder || "rgba(255, 255, 255, 0.1)"}`,
                                borderRadius: theme?.cardBorderRadius || "0.375rem",
                                padding: theme?.cardPadding || "1rem",
                                color: isActive
                                    ? (theme?.categoryCardHoverTitleColor || theme?.categoryCardTitleColor || "#ffffff")
                                    : (theme?.categoryCardTitleColor || "#ffffff"),
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = theme?.categoryCardHoverBackground || "rgba(255, 255, 255, 0.1)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = theme?.categoryCardBackground || "rgba(255, 255, 255, 0.05)";
                                }
                            }}
                        >
                            <span className="text-lg uppercase">
                                {link.name}
                            </span>
                        </Link>
                    );
                })}
            </div>

            <div className="col-span-12 md:col-span-6">
                {products && products.length > 0 ? (
                    <div 
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        style={{ gap: theme?.spacing || '1rem' }}
                    >
                        {products.map((product) => (
                            <DisplayProduct
                                key={product.id}
                                product={product}
                                theme={theme}
                                hidePurchaseTypeSelector={true}
                            />
                        ))}
                    </div>
                ) : (
                    activeCategory && activeCategory.children.length === 0 && (
                        <p 
                            className="text-center mt-4"
                            style={{
                                color: theme?.subtitleColor || "#b0b0b0"
                            }}
                        >
                            No products found in this category.
                        </p>
                    )
                )}
            </div>

            <div className="col-span-12 md:col-span-3 space-y-4">
                <div 
                    className="backdrop-blur p-4 rounded-md space-y-2"
                    style={{
                        backgroundColor: theme?.sidebarBackground || 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${theme?.sidebarBorder || 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: theme?.cardBorderRadius || '0.375rem',
                        padding: theme?.cardPadding || '1rem'
                    }}
                >
                    <h3 
                        className="text-2xl font-semibold flex gap-2.5 items-center"
                        style={{ color: theme?.sidebarTitleColor || '#ffffff' }}
                    >
                        <GiftIcon
                            className="text-muted"
                        />
                        Check Giftcard
                    </h3>
                    <CheckGiftcardForm theme={theme} />
                </div>
                <NeedSupport theme={theme} />
            </div>
        </div>
    );
}
