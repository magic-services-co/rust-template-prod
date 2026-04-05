"use client";

import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useCheckoutMutation, useSetCartItemMutation, useStoreData } from "@/hooks/store/use-storefront";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/laravel-auth";
import { signIn, useSession } from "@/lib/laravel-auth-react";
import { useCartContext } from "../context/store-context";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { toast } from "sonner";
import { openPayNowPopup } from "@/lib/paynow-popup";

export default function Cart({ theme }: { theme?: any }) {
    const router = useRouter()
    const { data: session, status } = useSession()
    const { data: store } = useStoreData();
    const { data: storeSettings } = useStoreSettings();
    const { cart, refetchCart, isLoading, isSuccess, isCartOpen, setIsCartOpen } = useCartContext();
    const { data, mutate, isSuccess: isCheckoutSuccess } = useCheckoutMutation();

    const cartMutation = useSetCartItemMutation();
    const handleCheckout = useCallback(() => {
        if (!getAuthToken()) {
            toast.error("Please sign in to checkout.");
            signIn("steam");
            return;
        }
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const returnUrl = baseUrl ? `${baseUrl}/store/complete?return_url=${encodeURIComponent(`${baseUrl}/store?success=true`)}` : undefined;
        mutate({
            lines: cart ? cart.lines.map((line: { product_id: string; quantity?: number; subscription?: boolean; game_server_id?: string; selected_gameserver_id?: string }) => {
                const checkoutLine: Record<string, unknown> = {
                    product_id: line.product_id,
                    quantity: line.quantity ?? 1,
                    subscription: line.subscription || false,
                };
                const serverId = line.game_server_id ?? line.selected_gameserver_id;
                if (serverId) (checkoutLine as any).selected_gameserver_id = serverId;
                return checkoutLine;
            }) : [],
            return_url: returnUrl,
        });
    }, [cart, mutate]);

    useEffect(() => {
        if (isCheckoutSuccess && data?.url) {
            const productIds = cart?.lines.map((line: { product_id: string }) => line.product_id) || [];
            openPayNowPopup(data.url, productIds, data.token);
        }
    }, [isCheckoutSuccess, data, cart?.lines]);

    useEffect(() => {
        if (cartMutation.isSuccess) {
            refetchCart();
        }
    }, [cartMutation.isSuccess, refetchCart]);

    const setCartItem = (productId: string, amount: number, gameServerId?: string, subscription?: boolean) => {
        cartMutation.mutate({
            productId,
            qty: amount,
            gameServerId,
            subscription
        });
    }
    /* 
        const removeFromCart = (productId: string, amount: number) => {
            const cartItem = cart?.lines.find((cartItem) => cartItem.product_id === productId);
            if (!cartItem) {
                return;
            }
            if (cartItem.quantity === 1) {
                cartMutation.mutate({
                    productId,
                    qty: 0
                });
                return;
            }
            cartMutation.mutate({
                productId,
                qty: cartItem.quantity - amount
            });
        } */
    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
                <Button
                    size={"lg"}
                    variant={"secondary"}
                    className="flex flex-col h-20 max-w-56 w-full backdrop-blur-md relative overflow-hidden group"
                    style={{
                        backgroundColor: theme?.sidebarBackground || 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${theme?.sidebarBorder || 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: theme?.buttonBorderRadius || '0.375rem',
                        color: theme?.sidebarTitleColor || '#ffffff'
                    }}
                    onClick={(event) => {
                        if (status === "loading") {
                            event.preventDefault();
                            return;
                        }

                        if (status === "unauthenticated") {
                            event.preventDefault();
                            return signIn("steam")
                        }
                    }}
                >
                    <ShoppingCartIcon
                        size={100}
                        className="absolute -rotate-45 z-0 opacity-5 right-0 group-hover:scale-125 duration-300"
                        style={{ color: theme?.sidebarTitleColor || '#ffffff' }}
                    />
                    <div className="flex flex-row items-center">
                        <span className="text-xl">View Cart</span>
                    </div>
                    {status === "unauthenticated" || status === "loading" ? (
                        <span 
                            className="text-xs uppercase"
                            style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                        >
                            {status === "loading" ? "Loading..." : "Sign in"}
                        </span>
                    ) : (
                        <span 
                            className="text-xs uppercase"
                            style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                        >
                            {((cart?.total ?? 0) / 100).toFixed(2)} {store?.currency}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent 
                className="backdrop-blur-md p-0 md:max-w-md w-10/12"
                style={{
                    backgroundColor: theme?.sidebarBackground || 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${theme?.sidebarBorder || 'rgba(255, 255, 255, 0.1)'}`
                }}
            >
                <SheetHeader 
                    className="relative group overflow-hidden px-6 py-8"
                    style={{ backgroundColor: theme?.categoryCardBackground || 'rgba(255, 255, 255, 0.1)' }}
                >
                    <SheetTitle 
                        className="select-none flex items-center uppercase gap-2.5 text-2xl font-bold"
                        style={{ color: theme?.sidebarTitleColor || '#ffffff' }}
                    >
                        <ShoppingCartIcon
                            size={25}
                            className=""
                        />
                        Your Cart
                    </SheetTitle>
                    <SheetDescription 
                        className="select-none font-semibold"
                        style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                    >
                        {cart?.lines.length ?? 0} items - {((cart?.total ?? 0) / 100).toFixed(2)} <span className="uppercase">{store?.currency}</span>
                    </SheetDescription>
                    <ShoppingCartIcon
                        size={150}
                        className="absolute z-0 opacity-5 -top-5 right-0 group-hover:scale-125 duration-300"
                        style={{ color: theme?.sidebarTitleColor || '#ffffff' }}
                    />
                </SheetHeader>
                {isLoading ? (
                    <div 
                        className="text-center py-12"
                        style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                    >
                        Loading Cart...
                    </div>
                ) : (null)}
                {isSuccess ? (
                    <div className="py-6 px-6 space-y-4">
                        {cart?.lines.map((product: { product_id: string; quantity?: number; name?: string; price?: number; game_server_id?: string; selected_gameserver_id?: string; selected_gameserver?: { name?: string } }) => (
                            <div
                                className="flex flex-row justify-between rounded-md py-2 px-4"
                                style={{
                                    backgroundColor: theme?.productCardBackground || 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: theme?.cardBorderRadius || '0.375rem'
                                }}
                                key={product.product_id}
                            >
                                <div className="">
                                    <div 
                                        className="font-semibold text-base"
                                        style={{ color: theme?.productCardTitleColor || '#ffffff' }}
                                    >
                                        {product.name}
                                    </div>
                                    {product.selected_gameserver?.name && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Server: {product.selected_gameserver.name}
                                        </div>
                                    )}
                                    {(product.selected_gameserver_id || product.game_server_id) && !product.selected_gameserver?.name && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Server ID: {product.selected_gameserver_id || product.game_server_id}
                                        </div>
                                    )}
                                    <div 
                                        className="font-normal text-sm uppercase"
                                        style={{ color: theme?.productCardPriceColor || '#22c55e' }}
                                    >
                                        {((product.price ?? 0) / 100).toFixed(2)} {store?.currency}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Button
                                        size={"icon"}
                                        variant={"destructive"}
                                        className="h-8 w-8"
                                        onClick={() => setCartItem(product.product_id, (product.quantity ?? 1) === 1 ? 0 : (product.quantity ?? 1) - 1)}
                                        disabled={cartMutation.isPending}
                                        style={{
                                            backgroundColor: theme?.errorTextColor || '#ef4444',
                                            borderRadius: theme?.buttonBorderRadius || '0.375rem'
                                        }}
                                    >
                                        <MinusIcon size={18} />
                                    </Button>
                                    <div 
                                        className="font-normal select-none rounded h-8 w-8 flex items-center justify-center"
                                        style={{
                                            backgroundColor: theme?.inputBackground || 'rgba(255, 255, 255, 0.1)',
                                            color: theme?.inputText || '#ffffff',
                                            borderRadius: theme?.buttonBorderRadius || '0.375rem'
                                        }}
                                    >
                                        {product.quantity}
                                    </div>
                                    <Button
                                        size={"icon"}
                                        variant={"secondary"}
                                        className="h-8 w-8"
                                        onClick={() => setCartItem(product.product_id, (product.quantity ?? 1) + 1)}
                                        disabled={cartMutation.isPending}
                                        style={{
                                            backgroundColor: theme?.successTextColor || '#22c55e',
                                            borderRadius: theme?.buttonBorderRadius || '0.375rem'
                                        }}
                                    >
                                        <PlusIcon size={18} />
                                    </Button>
                                    <Button
                                        size={"icon"}
                                        variant={"ghost"}
                                        className="h-8 w-8"
                                        onClick={() => setCartItem(product.product_id, 0)}
                                        disabled={cartMutation.isPending}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: theme?.sidebarTextColor || '#b0b0b0',
                                            borderRadius: theme?.buttonBorderRadius || '0.375rem'
                                        }}
                                    >
                                        <Trash2Icon size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (null)}
                <div className="px-6">
                    {cart && cart.lines.length > 0 ? (
                        <Button
                            size={"lg"}
                            className="w-full h-12 font-bold tracking-wide uppercase"
                            onClick={handleCheckout}
                            style={{
                                backgroundColor: theme?.buttonPrimaryBackground || '#52525b',
                                color: theme?.buttonPrimaryText || '#ffffff',
                                borderRadius: theme?.buttonBorderRadius || '0.375rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBackground || '#71717a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBackground || '#52525b';
                            }}
                        >
                            Checkout
                        </Button>
                    ) : (
                        <div className="text-center select-none mt-5">
                            <span 
                                className="text-base"
                                style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                            >
                                Your cart is empty.
                            </span>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet >
    )
}