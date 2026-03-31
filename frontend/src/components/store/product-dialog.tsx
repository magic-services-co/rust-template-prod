"use client";

import { Product } from "@/types/store";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Check, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import GiftButton from "./gift-button";
import { GameServerSelector } from "./game-server-selector";
import { useSetCartItemMutation, useStoreData, useCheckoutMutation } from "@/hooks/store/use-storefront";
import { useCartContext } from "../context/store-context";
import { useCallback, useEffect, useState, ReactNode } from "react";
import { signIn, useSession } from "@/lib/laravel-auth-react";
import { useRouter } from "next/navigation";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { toast } from "sonner";
import Image from "next/image";

interface ProductDialogProps {
    product: Product;
    trigger: ReactNode | ((open: boolean) => ReactNode);
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    theme?: any;
}

export function ProductDialog({ product, trigger, isOpen, setIsOpen, theme }: ProductDialogProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { data: store } = useStoreData();
    const { data: storeSettings } = useStoreSettings();
    const { cart, refetchCart, isCartOpen, setIsCartOpen, setCartItem } = useCartContext();
    const cartMutation = useSetCartItemMutation();
    const cartMutationIsPending = cartMutation.isPending;
    const { mutate: checkout, isPending: checkoutMutationIsPending } = useCheckoutMutation();
    const [justAdded, setJustAdded] = useState(false);
    const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
    const [purchaseType, setPurchaseType] = useState<"subscription" | "one-time">("one-time");
    const isInCart = cart?.lines.some((item) => item.product_id === product.id);
    const [countdown, setCountdown] = useState<string | null>(null);
    const supportsBoth = product.allow_one_time_purchase && product.allow_subscription;

    useEffect(() => {
        if (!isOpen) {
            setSelectedServerId(null);
            if (supportsBoth) {
                setPurchaseType("one-time");
            }
        }
    }, [isOpen, supportsBoth]);


    useEffect(() => {
        if (!product.enabled_until) {
            setCountdown(null);
            return;
        }
        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(product.enabled_until!);
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

    const handleCheckout = useCallback(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") return signIn("steam");
        if (storeSettings && storeSettings.requireLinkedToPurchase && !session?.user?.discordId) {
            toast.error("Please link your Discord account to purchase this product.");
            return;
        }

        if (product.single_game_server_only && !selectedServerId) {
            toast.error("Please select a server to continue.");
            return;
        }

        const isSubscription = supportsBoth ? purchaseType === "subscription" : product.allow_subscription;
        setCartItem(product.id, 1, selectedServerId || undefined, isSubscription);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
        if (!isCartOpen) {
            setIsCartOpen(true);
        }
    }, [status, product, selectedServerId, setCartItem, isCartOpen, setIsCartOpen, storeSettings, session?.user?.discordId, supportsBoth, purchaseType]);

    const handleAddToCart = useCallback(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") return signIn("steam");
        if (storeSettings && storeSettings.requireLinkedToPurchase && !session?.user?.discordId) {
            toast.error("Please link your Discord account to purchase this product.");
            return;
        }

        if (product.single_game_server_only && !selectedServerId) {
            toast.error("Please select a server to continue.");
            return;
        }

        const isSubscription = supportsBoth ? purchaseType === "subscription" : product.allow_subscription;
        setCartItem(product.id, 1, selectedServerId || undefined, isSubscription);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
        if (!isCartOpen) {
            setIsCartOpen(true);
        }
    }, [status, product, selectedServerId, setCartItem, isCartOpen, setIsCartOpen, storeSettings, session?.user?.discordId, supportsBoth, purchaseType]);

    const handleServerSelect = useCallback((serverId: string) => {
        setSelectedServerId(serverId);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {typeof trigger === 'function' ? trigger(isOpen) : trigger}
            </DialogTrigger>
            <DialogContent 
                className="flex flex-col md:flex-row max-h-[85vh] h-full overflow-y-auto md:overflow-y-hidden max-w-6xl border-border/5 backdrop-blur"
                style={{
                    backgroundColor: theme?.productCardBackground || 'rgba(255, 255, 255, 0.15)',
                    border: `1px solid ${theme?.productCardBorder || 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: theme?.cardBorderRadius || '0.375rem'
                }}
            >
                <DialogHeader className="md:max-w-[33%] w-full">
                    <div className="w-full">
                        <Image
                            src={typeof product.image_url === 'string' ? product.image_url : '/placeholder.png'}
                            alt={product.name ?? ''}
                            width={500}
                            height={500}
                            quality={100}
                            className="w-full h-full object-cover rounded-md"
                        />
                    </div>
                    <DialogTitle className="py-7 my-auto w-full">
                        <div 
                            className="block text-xl font-bold tracking-wider uppercase text-center"
                            style={{ color: theme?.productCardTitleColor || '#ffffff' }}
                        >
                            {product.name}
                        </div>
                        <div className="flex justify-center uppercase items-start mt-3">
                            <span 
                                className="text-lg font-medium"
                                style={{ color: theme?.productCardPriceColor || '#22c55e' }}
                            >
                                {((((product.pricing as { price_final?: number } | undefined)?.price_final ?? (product.price as number | undefined)) ?? 0) / 100).toFixed(2)} {store?.currency}
                            </span>
                            {(() => {
                                const p = product.pricing as { price_original?: number; price_final?: number } | undefined;
                                return p?.price_original && p?.price_final && p.price_original > p.price_final ? (
                                <span 
                                    className="text-base italic opacity-50 ml-3 line-through font-normal"
                                    style={{ color: theme?.productCardOriginalPriceColor || '#ef4444' }}
                                >
                                    {(p.price_original / 100).toFixed(2)} {store?.currency}
                                </span>
                            ) : null;
                            })()}
                        </div>
                        {countdown && (
                            <div 
                                className="text-center mt-2 text-sm font-semibold"
                                style={{ color: theme?.warningTextColor || '#fbbf24' }}
                            >
                                {countdown === "Product disabled" ? (
                                    <span>Product is now disabled</span>
                                ) : (
                                    <span>Available for: {countdown}</span>
                                )}
                            </div>
                        )}
                    </DialogTitle>
                    
                    {product.single_game_server_only && product.gameservers && product.gameservers.length > 0 && (
                        <div className="mb-4">
                            <GameServerSelector
                                servers={product.gameservers}
                                selectedServerId={selectedServerId}
                                onServerSelect={handleServerSelect}
                                theme={theme}
                            />
                        </div>
                    )}
                    
                    {supportsBoth && (
                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2" style={{ color: theme?.productCardDescriptionColor || '#b0b0b0' }}>
                                Purchase Type:
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={purchaseType === "one-time" ? "default" : "outline"}
                                    onClick={() => setPurchaseType("one-time")}
                                    className="flex-1"
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
                                    className="flex-1"
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
                    
                    <div className="flex flex-col gap-2.5">
                        {product.allow_subscription && !supportsBoth ? (
                            <Button
                                size="lg"
                                variant="default"
                                onClick={handleCheckout}
                                disabled={cartMutationIsPending || (product.single_game_server_only && !selectedServerId)}
                                className="w-full flex items-center justify-center gap-2.5 font-semibold"
                                style={{
                                    backgroundColor: theme?.buttonPrimaryBackground || '#3b82f6',
                                    color: theme?.buttonPrimaryText || '#ffffff',
                                    borderRadius: theme?.buttonBorderRadius || '0.375rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBackground || '#2563eb';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBackground || '#3b82f6';
                                    }
                                }}
                            >
                                {cartMutationIsPending ? (
                                    <Loader2 className="animate-spin" />
                                ) : justAdded ? (
                                    <Check size={18} />
                                ) : (
                                    <ShoppingCart size={18} />
                                )}
                                {cartMutationIsPending ? "Adding..." : (justAdded ? "Added to Cart" : "Add to Cart")}
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    size="lg"
                                    variant="default"
                                    onClick={handleAddToCart}
                                    disabled={cartMutationIsPending || (!supportsBoth && isInCart) || (product.single_game_server_only && !selectedServerId)}
                                    className="w-full flex items-center gap-2.5 font-semibold"
                                    style={{
                                        backgroundColor: theme?.buttonPrimaryBackground || '#3b82f6',
                                        color: theme?.buttonPrimaryText || '#ffffff',
                                        borderRadius: theme?.buttonBorderRadius || '0.375rem'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBackground || '#2563eb';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBackground || '#3b82f6';
                                        }
                                    }}
                                >
                                    {cartMutationIsPending ? (
                                        <Loader2 className="animate-spin" />
                                    ) : justAdded || (!supportsBoth && isInCart) ? (
                                        <Check size={18} />
                                    ) : (
                                        <ShoppingCart size={18} />
                                    )}
                                    {cartMutationIsPending ? "Adding..." : (justAdded ? "Added To Cart" : ((!supportsBoth && isInCart) ? "Already In Cart" : "Add To Cart"))}
                                </Button>
                            </div>
                        )}
                        {product.is_gifting_disabled !== true && (
                            <GiftButton product={product} selectedServerId={selectedServerId || undefined} />
                        )}
                    </div>
                </DialogHeader>
                <DialogDescription />
                <div 
                    className="h-full flex-grow mt-2.5 px-4 md:overflow-y-auto"
                    style={{ color: theme?.productCardDescriptionColor || '#b0b0b0' }}
                >
                    <div dangerouslySetInnerHTML={{ __html: typeof product.description === 'string' ? product.description : '' }} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
