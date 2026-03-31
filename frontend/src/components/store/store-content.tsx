"use client";

import DisplayProduct from "@/components/store/product";
import { useNavlinks, useProducts } from "@/hooks/store/use-storefront";
import { cn } from "@/lib/utils";
import { NavLink, Product } from "@/types/store";
import { ArrowRightIcon, Loader2, ChevronRightIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface StoreContentProps {
    params: { slug: string[] };
    initialProducts?: Product[];
    theme?: any;
}

function findNavLinkBySlug(navlinks: NavLink[], slug: string): NavLink | undefined {
    for (const link of navlinks) {
        if (link.tag_slug === slug) return link;
        const found = findNavLinkBySlug(link.children, slug);
        if (found) return found;
    }
    return undefined;
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

function getBreadcrumbPath(navlinks: NavLink[], slugPath: string[]): NavLink[] {
    if (slugPath.length === 0) return [];
    
    const breadcrumbs: NavLink[] = [];
    let currentLevel = navlinks;
    
    for (const slug of slugPath) {
        const found = currentLevel.find(link => link.tag_slug === slug);
        if (found) {
            breadcrumbs.push(found);
            currentLevel = found.children;
        } else {
            break;
        }
    }
    
    return breadcrumbs;
}

function isTagInNavLinkTree(tag: string, navLink: NavLink): boolean {
    if (navLink.tag_slug === tag) return true;
    return navLink.children.some(child => isTagInNavLinkTree(tag, child));
}

export default function StoreContent({ params, initialProducts, theme }: StoreContentProps) {
    const { data: productsData = initialProducts, isLoading: isLoadingProducts, error: productsError } = useProducts();
    const { data: navlinks, isLoading: isLoadingNavlinks } = useNavlinks();
    const searchParams = useSearchParams();
    const router = useRouter();

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

    const breadcrumbs = useMemo(() => {
        if (!navlinks || !params.slug || params.slug.length === 0) return [];
        return getBreadcrumbPath(navlinks, params.slug);
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

    return (
        <>
            <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
                style={{ gap: theme?.spacing || '0.75rem' }}
            >
                {(activeCategory ? activeCategory?.children : navlinks)?.map((link) => (
                    <Link
                        href={`/store${activeCategory
                            ? `/${params.slug.join('/')}/${link.tag_slug}`
                            : `/${link.tag_slug}`
                            }`}
                        className="relative group backdrop-blur p-4 flex items-center justify-center overflow-hidden rounded-md group transition-all duration-300"
                        style={{
                            backgroundColor: theme?.categoryCardBackground || "rgba(255, 255, 255, 0.05)",
                            border: `1px solid ${theme?.categoryCardBorder || "rgba(255, 255, 255, 0.1)"}`,
                            borderRadius: theme?.cardBorderRadius || "0.375rem",
                            padding: theme?.cardPadding || "1rem"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme?.categoryCardHoverBackground || "rgba(255, 255, 255, 0.1)";
                            const titleElement = e.currentTarget.querySelector('h3');
                            const arrowElement = e.currentTarget.querySelector('svg');
                            if (titleElement && theme?.categoryCardHoverTitleColor) {
                                titleElement.style.color = theme.categoryCardHoverTitleColor;
                            }
                            if (arrowElement && theme?.categoryCardHoverTitleColor) {
                                arrowElement.style.color = theme.categoryCardHoverTitleColor;
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme?.categoryCardBackground || "rgba(255, 255, 255, 0.05)";
                            const titleElement = e.currentTarget.querySelector('h3');
                            const arrowElement = e.currentTarget.querySelector('svg');
                            if (titleElement) {
                                titleElement.style.color = theme?.categoryCardTitleColor || "#ffffff";
                            }
                            if (arrowElement) {
                                arrowElement.style.color = theme?.categoryCardTitleColor || "#ffffff";
                            }
                        }}
                        key={link.node_id}
                    >
                        <div className="px-4 w-full flex justify-between">
                            <h3 
                                className="text-xl uppercase font-bold opacity-50 group-hover:opacity-100 duration-300"
                                style={{
                                    color: theme?.categoryCardTitleColor || "#ffffff"
                                }}
                            >
                                {link.name}
                            </h3>
                            <ArrowRightIcon
                                className="h-6 w-6 group-hover:translate-x-2 opacity-50 group-hover:opacity-100 duration-300"
                                style={{
                                    color: theme?.categoryCardTitleColor || "#ffffff"
                                }}
                            />
                        </div>
                    </Link>
                ))}
            </div>
            {products && products.length > 0 ? (
                <div 
                    className="grid grid-cols-1 md:grid-cols-3 gap-3"
                    style={{ gap: theme?.spacing || '0.75rem' }}
                >
                    {products.map((product) => (
                        <DisplayProduct
                            key={product.id}
                            product={product}
                            theme={theme}
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
        </>
    )
}