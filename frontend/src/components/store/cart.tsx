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
import { useCheckoutMutation, useStoreData } from "@/hooks/store/use-storefront";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/laravel-auth";
import { signIn, useSession } from "@/lib/laravel-auth-react";
import { useCartContext } from "../context/store-context";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { toast } from "sonner";
import { openPayNowPopup } from "@/lib/paynow-popup";

export default function Cart({ theme, variant = "button" }: { theme?: any; variant?: "button" | "sidebar" | "inline" }) {
    const router = useRouter()
    const { data: session, status } = useSession()
    const { data: store } = useStoreData();
    const { data: storeSettings } = useStoreSettings();
    const {
        cart,
        isLoading,
        isSuccess,
        isCartOpen,
        setIsCartOpen,
        setCartItem,
        isUpdatingCart,
    } = useCartContext();
    const { data, mutate, isSuccess: isCheckoutSuccess } = useCheckoutMutation();
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

    if (variant === "inline") {
        return (
            <CartBody
                theme={theme}
                compact
                cart={cart}
                store={store}
                isLoading={isLoading}
                isSuccess={isSuccess}
                cartMutationPending={isUpdatingCart}
                setCartItem={setCartItem}
                handleCheckout={handleCheckout}
            />
        );
    }

    return (
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
                {variant === "sidebar" ? (
                    <button
                        type="button"
                        className="ghost flex h-[41px] w-full items-center justify-center border text-[10px] font-bold tracking-[1.4px]"
                        style={{
                            borderColor: "rgba(186,145,66,0.6)",
                            color: theme?.buttonPrimaryText || "#f0c970",
                            backgroundColor: "transparent",
                        }}
                        onClick={(event) => {
                            if (status === "loading") {
                                event.preventDefault();
                                return;
                            }
                            if (status === "unauthenticated") {
                                event.preventDefault();
                                return signIn("steam");
                            }
                        }}
                    >
                        VIEW CART
                    </button>
                ) : (
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
                )}
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
                <CartBody
                    theme={theme}
                    cart={cart}
                    store={store}
                    isLoading={isLoading}
                    isSuccess={isSuccess}
                    cartMutationPending={isUpdatingCart}
                    setCartItem={setCartItem}
                    handleCheckout={handleCheckout}
                />
            </SheetContent>
        </Sheet >
    )
}

export function CartBody({
    theme,
    compact = false,
    cart,
    store,
    isLoading,
    isSuccess,
    cartMutationPending,
    setCartItem,
    handleCheckout,
}: {
    theme?: any;
    compact?: boolean;
    cart?: { lines: Array<{ product_id: string; quantity?: number; name?: string; price?: number; game_server_id?: string; selected_gameserver_id?: string; selected_gameserver?: { name?: string }; subscription?: boolean }>; total?: number };
    store?: { currency?: string } | null;
    isLoading: boolean;
    isSuccess: boolean;
    cartMutationPending: boolean;
    setCartItem: (productId: string, amount: number, gameServerId?: string, subscription?: boolean) => void;
    handleCheckout: () => void;
}) {
    const currency = store?.currency || "USD";

    if (isLoading) {
        return (
            <p className="store-order-meta py-4 text-center text-[11px]">Loading cart…</p>
        );
    }

    if (!isSuccess) return null;

    return (
        <div className={compact ? "flex flex-col gap-3" : "space-y-4 px-6 py-6"}>
            {cart?.lines.map((product) => (
                <div
                    key={product.product_id}
                    className={compact ? "border-b border-[rgba(255,255,255,0.1)] pb-3" : "flex flex-row justify-between rounded-md px-4 py-2"}
                    style={compact ? undefined : {
                        backgroundColor: theme?.productCardBackground || "rgba(255, 255, 255, 0.05)",
                        borderRadius: theme?.cardBorderRadius || "0.375rem",
                    }}
                >
                    <div className={compact ? "" : "flex w-full flex-row justify-between"}>
                        <p className="store-order-name text-[12px] font-extrabold leading-5">
                            {(product.name || "Package").toUpperCase()}
                        </p>
                        {product.selected_gameserver?.name ? (
                            <p className="store-order-meta pt-1 text-[10px]">
                                {product.selected_gameserver.name}
                            </p>
                        ) : (product.selected_gameserver_id || product.game_server_id) ? (
                            <p className="store-order-meta pt-1 text-[10px]">
                                Server {product.selected_gameserver_id || product.game_server_id}
                            </p>
                        ) : null}
                        {product.subscription ? (
                            <p className="store-order-meta pt-1 text-[10px]">Subscription</p>
                        ) : null}
                        <div className="flex items-center justify-between pt-2">
                            <p className="store-order-price text-[13px] font-bold">
                                ${(((product.price ?? 0) / 100) * (product.quantity ?? 1)).toFixed(2)} {currency}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    className="ghost flex size-7 items-center justify-center text-[12px]"
                                    style={{ color: theme?.sidebarTextColor || "#7d8da0" }}
                                    disabled={cartMutationPending}
                                    onClick={() =>
                                        setCartItem(
                                            product.product_id,
                                            (product.quantity ?? 1) === 1 ? 0 : (product.quantity ?? 1) - 1
                                        )
                                    }
                                >
                                    <MinusIcon size={14} />
                                </button>
                                <span className="store-order-name w-4 text-center text-[11px]">{product.quantity ?? 1}</span>
                                <button
                                    type="button"
                                    className="ghost flex size-7 items-center justify-center text-[12px]"
                                    style={{ color: theme?.sidebarTextColor || "#7d8da0" }}
                                    disabled={cartMutationPending}
                                    onClick={() => setCartItem(product.product_id, (product.quantity ?? 1) + 1)}
                                >
                                    <PlusIcon size={14} />
                                </button>
                                <button
                                    type="button"
                                    className="ghost flex size-7 items-center justify-center"
                                    style={{ color: theme?.sidebarTextColor || "#7d8da0" }}
                                    disabled={cartMutationPending}
                                    onClick={() => setCartItem(product.product_id, 0)}
                                >
                                    <Trash2Icon size={13} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {cart && cart.lines.length > 0 ? (
                <button
                    type="button"
                    className="ghost mt-1 flex h-[41px] w-full items-center justify-center border text-[10px] font-bold tracking-[1.4px]"
                    style={{
                        borderColor: "rgba(186,145,66,0.6)",
                        color: theme?.buttonPrimaryText || "#f0c970",
                        backgroundColor: "transparent",
                    }}
                    onClick={handleCheckout}
                >
                    CHECKOUT
                </button>
            ) : (
                <p className="store-order-meta pt-2 text-center text-[11px]">Your cart is empty.</p>
            )}
        </div>
    );
}