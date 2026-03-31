"use client";

import { useStoreData, useCheckoutMutation } from "@/hooks/store/use-storefront";
import { Product } from "@/types/store";
import { Button } from "@/components/ui/button";
import { Check, InfoIcon, Loader2, ShoppingCart, ShoppingBag } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { ProductDialog } from "./product-dialog";
import { signIn, useSession } from "@/lib/laravel-auth-react";
import { getAuthToken } from "@/lib/laravel-auth";
import { useCartContext } from "../context/store-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStoreSettings } from "@/hooks/use-store-settings";
import Image from "next/image";
import { openPayNowPopup } from "@/lib/paynow-popup";

export default function DisplayProduct({ product, theme, hidePurchaseTypeSelector = false }: { product: Product; theme?: any; hidePurchaseTypeSelector?: boolean }) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { data: store } = useStoreData();
    const { status, data: session } = useSession();
    const router = useRouter();
    const { cart, isCartOpen, setIsCartOpen, setCartItem } = useCartContext();
    const { data: checkoutData, mutate: mutateCheckout, isSuccess: isCheckoutSuccess } = useCheckoutMutation();
    const { data: storeSettings } = useStoreSettings();
    const [justAdded, setJustAdded] = useState(false);
    const [purchaseType, setPurchaseType] = useState<"subscription" | "one-time">("one-time");
    const isInCart = cart?.lines.some((item: { product_id: string }) => item.product_id === product.id);
    const [countdown, setCountdown] = useState<string | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const supportsBoth = product.allow_one_time_purchase && product.allow_subscription;

    useEffect(() => {
        if (isCheckoutSuccess && checkoutData?.url) {
            openPayNowPopup(checkoutData.url, [product.id]);
        }
    }, [isCheckoutSuccess, checkoutData?.url, product.id]);

    useEffect(() => {
        if (!product.enabled_until || typeof product.enabled_until !== 'string') {
            setCountdown(null);
            return;
        }
        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(product.enabled_until as string);
            const diff = end.getTime() - now.getTime();
            if (diff <= 0) {
                setCountdown("Product disabled");
                clearInterval(interval);
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setCountdown(
                `${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [product.enabled_until]);

    const handlePurchase = useCallback(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") return signIn("steam");
        if (!getAuthToken()) {
            toast.error("Sign in to add to cart.");
            signIn("steam");
            return;
        }
        if (storeSettings?.requireLinkedToPurchase) {
            const hasLinked = !!(session?.user && ((session.user as Record<string, unknown>).discordId ?? (session.user as Record<string, unknown>).steamId));
            if (!hasLinked) {
                toast.error("Please link your Discord or Steam account in your profile to add to cart.");
                return;
            }
        }

        if (product.single_game_server_only && product.gameservers && product.gameservers.length > 0) {
            setIsOpen(true);
            return;
        }

        const isSubscription = supportsBoth ? purchaseType === "subscription" : product.allow_subscription;
        setCartItem(product.id, 1, undefined, isSubscription);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
        if (!isCartOpen) {
            setIsCartOpen(true);
        }
    }, [status, product, setCartItem, isCartOpen, setIsCartOpen, storeSettings, session?.user, supportsBoth, purchaseType]);

    return (
        <div 
            key={product.id} 
            className="group flex flex-col justify-end backdrop-blur p-4 rounded-md transition-all duration-300 relative"
            style={{
                backgroundColor: theme?.productCardBackground || "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${theme?.productCardBorder || "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: theme?.cardBorderRadius || "0.375rem",
                padding: theme?.cardPadding || "1rem"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme?.productCardHoverBackground || "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme?.productCardBackground || "rgba(255, 255, 255, 0.05)";
            }}
        >
            {(() => {
                const p = product.pricing as { price_original?: number; price_final?: number } | undefined;
                const showDiscount = p?.price_original && p?.price_final && p.price_original > p.price_final && Math.round((1 - p.price_final / p.price_original) * 100) > 0;
                return showDiscount ? (
                <div 
                    className="absolute top-2 left-2 text-xs px-2 py-1 rounded font-semibold z-10"
                    style={{
                        backgroundColor: theme?.productCardDiscountBadgeBackground || '#ef4444',
                        color: theme?.productCardDiscountBadgeText || '#ffffff',
                        borderRadius: theme?.buttonBorderRadius || '0.375rem'
                    }}
                >
                    -{Math.round((1 - ((p.price_final ?? 0) / (p.price_original ?? 1))) * 100)}%
                </div>
            ) : null;
            })()}
            
            {countdown && (
                <div 
                    className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-yellow-400/90 text-black font-semibold z-10 cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    {countdown === "Product disabled" ? (
                        <span>Disabled</span>
                    ) : (
                        <span>{countdown}</span>
                    )}
                    {showTooltip && countdown !== "Product disabled" && (
                        <div className="absolute right-0 mt-2 w-56 bg-black text-white text-xs rounded shadow-lg p-2 z-20" style={{top: '100%'}}>
                            This product will expire and become unavailable when the timer reaches zero.
                        </div>
                    )}
                </div>
            )}
            <div className="w-full" onClick={() => setIsOpen(true)}>
                <Image
                    src={typeof product.image_url === 'string' ? product.image_url : '/placeholder.png'}
                    alt={product.name ?? ''}
                    width={100}
                    height={100}
                    className="cursor-pointer mx-auto rounded-md group-hover:scale-90 duration-300"
                />
            </div>
            <div className="">
                <div className="py-7 my-auto w-full">
                    <span 
                        className="block text-xl font-bold tracking-wider uppercase text-center"
                        style={{
                            color: theme?.productCardTitleColor || "#ffffff"
                        }}
                    >
                        {product.name}
                    </span>
                    <div className="flex justify-center uppercase items-start mt-3">
                        <span 
                            className="text-lg font-medium"
                            style={{
                                color: theme?.productCardPriceColor || "#22c55e"
                            }}
                        >
                            {((( (product.pricing as { price_final?: number } | undefined)?.price_final ?? (product.price as number | undefined) ) ?? 0) / 100).toFixed(2)} {store?.currency}
                        </span>
                        {(() => {
                            const p = product.pricing as { price_original?: number; price_final?: number } | undefined;
                            return p?.price_original && p?.price_final && p.price_original > p.price_final ? (
                            <span 
                                className="text-base italic opacity-50 ml-3 line-through font-normal"
                                style={{
                                    color: theme?.productCardOriginalPriceColor || "#9ca3af"
                                }}
                            >
                                {((p.price_original ?? 0) / 100).toFixed(2)} {store?.currency}
                            </span>
                        ) : null;
                        })()}
                    </div>
                </div>
                {supportsBoth && !hidePurchaseTypeSelector && (
                    <div className="mb-3">
                        <div className="text-xs font-medium mb-1.5" style={{ color: theme?.productCardDescriptionColor || '#b0b0b0' }}>
                            Purchase Type:
                        </div>
                        <div className="flex gap-1.5">
                            <Button
                                size="sm"
                                variant={purchaseType === "one-time" ? "default" : "outline"}
                                onClick={() => setPurchaseType("one-time")}
                                className="flex-1 text-xs"
                                style={{
                                    backgroundColor: purchaseType === "one-time" 
                                        ? (theme?.buttonPrimaryBackground || '#3b82f6')
                                        : 'transparent',
                                    color: purchaseType === "one-time"
                                        ? (theme?.buttonPrimaryText || '#ffffff')
                                        : (theme?.productCardDescriptionColor || '#b0b0b0'),
                                    border: `1px solid ${purchaseType === "one-time" 
                                        ? (theme?.buttonPrimaryBackground || '#3b82f6')
                                        : (theme?.productCardBorder || 'rgba(255, 255, 255, 0.1)')}`,
                                    borderRadius: theme?.buttonBorderRadius || '0.375rem'
                                }}
                            >
                                One-Time
                            </Button>
                            <Button
                                size="sm"
                                variant={purchaseType === "subscription" ? "default" : "outline"}
                                onClick={() => setPurchaseType("subscription")}
                                className="flex-1 text-xs"
                                style={{
                                    backgroundColor: purchaseType === "subscription" 
                                        ? (theme?.buttonPrimaryBackground || '#3b82f6')
                                        : 'transparent',
                                    color: purchaseType === "subscription"
                                        ? (theme?.buttonPrimaryText || '#ffffff')
                                        : (theme?.productCardDescriptionColor || '#b0b0b0'),
                                    border: `1px solid ${purchaseType === "subscription" 
                                        ? (theme?.buttonPrimaryBackground || '#3b82f6')
                                        : (theme?.productCardBorder || 'rgba(255, 255, 255, 0.1)')}`,
                                    borderRadius: theme?.buttonBorderRadius || '0.375rem'
                                }}
                            >
                                Subscription
                            </Button>
                        </div>
                    </div>
                )}
                <div 
                    className="flex gap-2"
                    style={{ gap: theme?.spacing || '0.5rem' }}
                >
                    <ProductDialog
                        product={product}
                        isOpen={isOpen}
                        setIsOpen={setIsOpen}
                        theme={theme}
                        trigger={<Button
                            size="lg"
                            variant="secondary"
                            className="font-semibold px-4"
                            onClick={() => setIsOpen(true)}
                            style={{
                                backgroundColor: theme?.buttonSecondaryBackground || "transparent",
                                color: theme?.buttonSecondaryText || "#9ca3af",
                                border: `1px solid ${theme?.buttonSecondaryBorder || "#374151"}`,
                                borderRadius: theme?.buttonBorderRadius || "0.375rem"
                            }}
                        >
                            <InfoIcon size={18} />
                        </Button>}
                    />
                    <Button
                        size="lg"
                        variant="secondary"
                        className="w-full flex-grow font-semibold"
                        onClick={handlePurchase}
                        disabled={!supportsBoth && !product.allow_subscription && isInCart}
                        style={{
                            backgroundColor: theme?.buttonPrimaryBackground || "#3b82f6",
                            color: theme?.buttonPrimaryText || "#ffffff",
                            border: `1px solid ${theme?.buttonSecondaryBorder || "#374151"}`,
                            borderRadius: theme?.buttonBorderRadius || "0.375rem"
                        }}
                        onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBackground || "#2563eb";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) {
                                e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBackground || "#3b82f6";
                            }
                        }}
                    >
                        {(supportsBoth && purchaseType === "subscription") || (!supportsBoth && product.allow_subscription) ? (
                            <ShoppingBag className="mr-2" size={18} />
                        ) : justAdded ? (
                            <Check className="mr-2" size={18} />
                        ) : (
                            <ShoppingCart className="mr-2" size={18} />
                        )}
                        {justAdded ? "Added To Cart" : (isInCart ? "Already In Cart" : "Add To Cart")}
                    </Button>
                </div>
            </div>
        </div>
    )
}