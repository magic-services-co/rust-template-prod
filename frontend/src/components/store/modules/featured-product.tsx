"use client"

import { useProducts, useStoreData } from "@/hooks/store/use-storefront";
import { Button } from "@/components/ui/button";
import { InfoIcon, TrophyIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { ProductDialog } from "../product-dialog";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { Product } from "@/types/store";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedProduct({ theme }: { theme?: any }) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { data: store } = useStoreData();
    const { data: storeSettings } = useStoreSettings();
    const { data: products, isLoading } = useProducts();

    if (!store || !store.id || !storeSettings?.featuredProductEnabled) return null;

    if (isLoading) {
        return (
            <div 
                className="backdrop-blur p-4 rounded-md space-y-2"
                style={{
                    backgroundColor: theme?.sidebarBackground || 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme?.sidebarBorder || 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: theme?.cardBorderRadius || '0.375rem',
                    padding: theme?.cardPadding || '1rem'
                }}
            >
                <div className="flex gap-2.5 items-center">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-8 w-40" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="w-full aspect-square rounded-md" />
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-6 w-1/3 mx-auto" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    if (!products) return null;
    const product = products.find((p: Product) => p.id === storeSettings?.featuredProductId);

    if (!product) {
        return (
            <div className="text-center py-2">
                <h2 
                    className="text-base font-bold tracking-wider uppercase"
                    style={{ color: theme?.subtitleColor || '#9ca3af' }}
                >
                    No product found
                </h2>
            </div>
        )
    }

    return (
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
                <TrophyIcon className="text-muted" />
                Featured Package
            </h3>
            <div className="group flex flex-col text-center">
                <div className="w-full relative">
                    <Image
                        src={product?.image_url ?? ""}
                        alt={product?.name ?? ""}
                        width={300}
                        height={300}
                        className="rounded-md w-full h-auto group-hover:scale-95 transition-transform duration-300"
                    />
                </div>
                <div className="w-full flex flex-col justify-between">
                    <div>
                        <h2 
                            className="text-2xl font-bold tracking-wider uppercase mb-4"
                            style={{ color: theme?.productCardTitleColor || '#ffffff' }}
                        >
                            {product.name}
                        </h2>
                        <div className="flex justify-center uppercase items-baseline mb-6">
                            <span 
                                className="text-xl font-medium"
                                style={{ color: theme?.productCardPriceColor || '#22c55e' }}
                            >
                                {((product.pricing?.price_final ?? product.price) / 100).toFixed(2)} {store?.currency}
                            </span>
                            {product.pricing?.price_original && product.pricing?.price_final && product.pricing.price_original > product.pricing.price_final ? (
                                <span 
                                    className="text-base italic opacity-50 ml-3 line-through font-normal"
                                    style={{ color: theme?.productCardOriginalPriceColor || '#ef4444' }}
                                >
                                    {(product.pricing.price_original / 100).toFixed(2)} {store?.currency}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <ProductDialog
                        isOpen={isOpen}
                        setIsOpen={setIsOpen}
                        product={product}
                        theme={theme}
                        trigger={<Button
                            size="lg"
                            variant="secondary"
                            className="w-full font-semibold"
                            style={{
                                backgroundColor: theme?.buttonSecondaryBackground || 'transparent',
                                color: theme?.buttonSecondaryText || '#9ca3af',
                                border: `1px solid ${theme?.buttonSecondaryBorder || '#374151'}`,
                                borderRadius: theme?.buttonBorderRadius || '0.375rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme?.buttonSecondaryHoverBackground || '#374151';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = theme?.buttonSecondaryBackground || 'transparent';
                            }}
                        >
                            <InfoIcon className="mr-2.5" />
                            View Package
                        </Button>}
                    />
                </div>
            </div>
        </div>
    )
}