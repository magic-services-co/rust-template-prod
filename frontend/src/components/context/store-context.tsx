"use client";

import React, { createContext, useContext, useState } from 'react';
import { useCart, useSetCartItemMutation } from "@/hooks/store/use-storefront";
import { useSession } from "@/lib/laravel-auth-react";
import { Cart, GameServer } from '@/types/store';

export type StorePurchaseType = "one-time" | "subscription";
export type StoreSidebarView = "configure" | "cart";

export type SelectedStorePackage = {
    id: string;
    name: string;
    price: number;
    allow_one_time_purchase?: boolean;
    allow_subscription?: boolean;
    single_game_server_only?: boolean;
    gameservers?: GameServer[];
};

interface CartContextType {
    cart?: Cart; 
    isLoading: boolean;
    isSuccess: boolean;
    refetchCart: () => void;
    setCartItem: (productId: string, amount: number, gameServerId?: string, subscription?: boolean) => void;
    isUpdatingCart: boolean;
    isCartOpen: boolean;
    setIsCartOpen: (isCartOpen: boolean) => void;
    steamId?: string | null;
    discordId?: string | null;
    purchaseType: StorePurchaseType;
    setPurchaseType: (purchaseType: StorePurchaseType) => void;
    selectedPackage: SelectedStorePackage | null;
    setSelectedPackage: (pack: SelectedStorePackage | null) => void;
    sidebarView: StoreSidebarView;
    setSidebarView: (view: StoreSidebarView) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getSessionIds(session: { user?: Record<string, unknown> } | null) {
    const u = session?.user as Record<string, unknown> | undefined;
    const steamId = (u && (typeof u.steamId === 'string' ? u.steamId : typeof u.steam_id === 'string' ? u.steam_id : null)) ?? null;
    const discordId = (u && (typeof u.discordId === 'string' ? u.discordId : typeof u.discord_id === 'string' ? u.discord_id : null)) ?? null;
    return { steamId, discordId };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [purchaseType, setPurchaseType] = useState<StorePurchaseType>("one-time");
    const [selectedPackage, setSelectedPackageState] = useState<SelectedStorePackage | null>(null);
    const [sidebarView, setSidebarView] = useState<StoreSidebarView>("configure");
    const { data: session } = useSession();
    const { steamId, discordId } = getSessionIds(session);
    const { data: cart, refetch: refetchCart, isLoading, isSuccess } = useCart();
    const cartMutation = useSetCartItemMutation();

    const setSelectedPackage = (pack: SelectedStorePackage | null) => {
        setSelectedPackageState(pack);
        if (pack) {
            const onlySubscription = pack.allow_subscription && !pack.allow_one_time_purchase;
            setPurchaseType(onlySubscription ? "subscription" : "one-time");
            setSidebarView("configure");
        }
    };


    const setCartItem = (productId: string, amount: number, gameServerId?: string, subscription?: boolean) => {
        if (amount <= 0) {
            if (selectedPackage?.id === productId) {
                setSelectedPackageState(null);
            }
            const hasOtherItems = (cart?.lines ?? []).some(
                (line) => line.product_id !== productId && (line.quantity ?? 0) > 0
            );
            if (!hasOtherItems) {
                setSidebarView("configure");
            }
        }
        cartMutation.mutate({ productId, qty: amount, gameServerId, subscription });
    };

    return (
        <CartContext.Provider value={{
            cart,
            isLoading,
            isSuccess,
            refetchCart,
            setCartItem,
            isUpdatingCart: cartMutation.isPending,
            isCartOpen,
            setIsCartOpen,
            steamId,
            discordId,
            purchaseType,
            setPurchaseType,
            selectedPackage,
            setSelectedPackage,
            sidebarView,
            setSidebarView,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCartContext() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCartContext must be used within a CartProvider');
    }
    return context;
}