"use client";

import React, { createContext, useContext, useState } from 'react';
import { useCart, useSetCartItemMutation } from "@/hooks/store/use-storefront";
import { useSession } from "@/lib/laravel-auth-react";
import { Cart } from '@/types/store';

interface CartContextType {
    cart?: Cart; 
    isLoading: boolean;
    isSuccess: boolean;
    refetchCart: () => void;
    setCartItem: (productId: string, amount: number, gameServerId?: string, subscription?: boolean) => void;
    isCartOpen: boolean;
    setIsCartOpen: (isCartOpen: boolean) => void;
    steamId?: string | null;
    discordId?: string | null;
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
    const { data: session } = useSession();
    const { steamId, discordId } = getSessionIds(session);
    const { data: cart, refetch: refetchCart, isLoading, isSuccess } = useCart();
    const cartMutation = useSetCartItemMutation();

    const setCartItem = (productId: string, amount: number, gameServerId?: string, subscription?: boolean) => {
        cartMutation.mutate({ productId, qty: amount, gameServerId, subscription });
    };


    return (
        <CartContext.Provider value={{
            cart,
            isLoading,
            isSuccess,
            refetchCart,
            setCartItem,
            isCartOpen,
            setIsCartOpen,
            steamId,
            discordId,
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