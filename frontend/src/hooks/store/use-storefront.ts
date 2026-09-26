'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { backendApi } from '@/lib/api';
import { getAuthToken } from '@/lib/laravel-auth';
import type { Order, Subscription, Cart } from '@/types/store';

export type NavLink = {
  node_id: string;
  name: string;
  tag_slug: string;
  children: NavLink[];
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
  }
  return headers;
}

async function fetchNavlinks(): Promise<NavLink[]> {
  const res = await fetch(backendApi('store/navlinks'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return data as NavLink[];
  }
  return [];
}

export function useNavlinks() {
  const query = useQuery({
    queryKey: ['storefront', 'navlinks'],
    queryFn: fetchNavlinks,
    staleTime: 60 * 1000,
  });
  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useProducts() {
  const query = useQuery({
    queryKey: ['storefront', 'products'],
    queryFn: async () => {
      const res = await fetch(backendApi('store/products'), { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.data) ? data.data : [];
    },
    staleTime: 60 * 1000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useStoreData() {
  const query = useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const res = await fetch(backendApi('site-settings'), { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60 * 1000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
  };
}

const emptyCart: Cart = { lines: [], total: 0, currency: 'usd', store_id: null, customer_id: null };

function normalizeCart(payload: unknown): Cart {
  const root = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const nested =
    (root.cart && typeof root.cart === 'object' ? (root.cart as Record<string, unknown>) : null) ??
    (root.data && typeof root.data === 'object' && !Array.isArray(root.data) ? (root.data as Record<string, unknown>) : null) ??
    root;
  const cart =
    nested.data && typeof nested.data === 'object' && !Array.isArray(nested.data) && ('lines' in (nested.data as object) || 'items' in (nested.data as object))
      ? (nested.data as Record<string, unknown>)
      : nested;
  const rawLines = Array.isArray(cart.lines) ? cart.lines : Array.isArray(cart.items) ? cart.items : [];
  const lines = rawLines
    .map((line) => {
      if (!line || typeof line !== 'object') return null;
      const row = line as Record<string, unknown>;
      const product = row.product && typeof row.product === 'object' ? (row.product as Record<string, unknown>) : {};
      const productId = String(row.product_id ?? product.id ?? row.id ?? '');
      if (!productId) return null;
      const pricing =
        (row.pricing && typeof row.pricing === 'object' ? (row.pricing as Record<string, unknown>) : null) ??
        (product.pricing && typeof product.pricing === 'object' ? (product.pricing as Record<string, unknown>) : null) ??
        {};
      return {
        product_id: productId,
        quantity: Number(row.quantity ?? row.qty ?? 0),
        name: String(row.name ?? product.name ?? productId),
        price: Number(row.price ?? row.unit_price ?? pricing.price_final ?? product.price ?? 0),
        subscription: Boolean(row.subscription),
        selected_gameserver_id: typeof row.selected_gameserver_id === 'string'
          ? row.selected_gameserver_id
          : typeof row.gameserver_id === 'string'
            ? row.gameserver_id
            : typeof row.game_server_id === 'string'
              ? row.game_server_id
              : undefined,
        game_server_id: typeof row.game_server_id === 'string'
          ? row.game_server_id
          : typeof row.gameserver_id === 'string'
            ? row.gameserver_id
            : typeof row.selected_gameserver_id === 'string'
              ? row.selected_gameserver_id
              : undefined,
        selected_gameserver: row.selected_gameserver,
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);

  const totalFromCart = Number(cart.total ?? cart.total_amount ?? 0);
  const total = totalFromCart || lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return {
    lines,
    total,
    currency: typeof cart.currency === 'string' ? cart.currency : 'usd',
    store_id: (cart.store_id as string | null) ?? null,
    customer_id: (cart.customer_id as string | null) ?? null,
  };
}

export function useCart(_steamId?: string | null, _discordId?: string | null) {
  const query = useQuery({
    queryKey: ['storefront', 'cart'],
    queryFn: async () => {
      if (!getAuthToken()) return emptyCart;
      const res = await fetch(backendApi('store/cart'), {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return emptyCart;
      return normalizeCart(data);
    },
    staleTime: 15 * 1000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}

export function useSetCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { productId: string; qty: number; gameServerId?: string; subscription?: boolean }) => {
      const res = await fetch(backendApi('store/cart/items'), {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: payload.productId,
          qty: payload.qty,
          gameServerId: payload.gameServerId,
          subscription: payload.subscription,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data?.error ?? data?.message ?? 'Failed to update cart.') as string;
        throw new Error(msg);
      }
      return { cart: normalizeCart(data) };
    },
    onSuccess: async (data) => {
      if (data?.cart?.lines?.length) {
        queryClient.setQueriesData({ queryKey: ['storefront', 'cart'] }, () => data.cart);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['storefront', 'cart'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update cart.');
    },
  });
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: { lines?: unknown[]; return_url?: string }) => {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const returnUrl =
        payload?.return_url ?? `${baseUrl}/store/complete?return_url=${encodeURIComponent(`${baseUrl}/store?success=true`)}`;
      const res = await fetch(backendApi('store/checkout'), {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lines: payload?.lines ?? [],
          return_url: returnUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data?.error ?? data?.message ?? 'Checkout failed') as string;
        throw new Error(msg);
      }
      const url = data?.url ?? data?.data?.url;
      const checkoutToken = data?.token ?? data?.data?.token;
      if (!url) throw new Error('No checkout URL received.');
      return { url, token: checkoutToken, id: data?.id ?? data?.data?.id };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront', 'cart'] }),
    onError: (err: Error) => {
      toast.error(err.message || 'Checkout failed.');
    },
  });
}

export function useOrders() {
  const query = useQuery({
    queryKey: ['storefront', 'orders'],
    queryFn: async () => {
      const res = await fetch(backendApi('store/orders'), { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.data) ? (data.data as Order[]) : [];
    },
    staleTime: 60 * 1000,
  });
  return { data: query.data ?? [], isLoading: query.isLoading, isSuccess: query.isSuccess };
}

export function useSubscriptions() {
  const query = useQuery({
    queryKey: ['storefront', 'subscriptions'],
    queryFn: async (): Promise<Subscription[]> => {
      const res = await fetch(backendApi('store/subscriptions'), { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.data) ? (data.data as Subscription[]) : [];
    },
    staleTime: 60 * 1000,
  });
  return { data: query.data ?? [], isLoading: query.isLoading, isSuccess: query.isSuccess };
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await fetch(backendApi(`store/subscriptions/${subscriptionId}/cancel`), {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel subscription');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront', 'subscriptions'] }),
  });
}
