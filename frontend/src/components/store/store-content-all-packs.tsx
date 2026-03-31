"use client";

import DisplayProduct from "@/components/store/product";
import { useProducts } from "@/hooks/store/use-storefront";
import { Product } from "@/types/store";
import { Loader2, GiftIcon } from "lucide-react";
import { useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import CheckGiftcardForm from "@/components/forms/check-giftcard-form";
import NeedSupport from "@/components/store/modules/need-support";

interface StoreContentAllPacksProps {
    initialProducts?: Product[];
    theme?: any;
}

export default function StoreContentAllPacks({ initialProducts, theme }: StoreContentAllPacksProps) {
    const { data: productsData = initialProducts, isLoading: isLoadingProducts, error: productsError } = useProducts();
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

    const products = useMemo<Product[] | undefined>(() => {
        if (!productsData) return undefined;

        return productsData.filter((product: Product) => {
            if (product.enabled_at || product.enabled_until) {
                const now = new Date();
                const enabledAt = product.enabled_at ? new Date(product.enabled_at as string | number | Date) : null;
                const enabledUntil = product.enabled_until ? new Date(product.enabled_until as string | number | Date) : null;

                if (enabledAt && now < enabledAt) return false;
                if (enabledUntil && now > enabledUntil) return false;
            }

            return true;
        });
    }, [productsData]);

    if (!hasData && isLoadingProducts) {
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
        <div className="grid grid-cols-12 gap-6 w-full">
            <div className="col-span-12 md:col-span-9">
                {products && products.length > 0 ? (
                    <div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
                    <p 
                        className="text-center mt-4"
                        style={{
                            color: theme?.subtitleColor || "#b0b0b0"
                        }}
                    >
                        No products available.
                    </p>
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
