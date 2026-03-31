'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { backendApi } from '@/lib/api';
import { getAuthToken } from '@/lib/laravel-auth';

const PAYNOW_BASE = 'https://api.paynow.gg/v1';
const PAYNOW_CUSTOMER_TOKEN_KEY = 'paynow-customer-token';

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

async function getPayNowCustomerToken(): Promise<string | null> {
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(PAYNOW_CUSTOMER_TOKEN_KEY);
    if (cached) return cached;
  }
  const res = await fetch(backendApi('store/paynow-customer-token'), {
    headers: authHeaders(),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(PAYNOW_CUSTOMER_TOKEN_KEY);
    return null;
  }
  const token = data?.token ?? null;
  if (token && typeof localStorage !== 'undefined') {
    localStorage.setItem(PAYNOW_CUSTOMER_TOKEN_KEY, token);
  }
  return token;
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

const emptyCart = { lines: [], total: 0, currency: 'usd', store_id: null, customer_id: null };

async function getStoreId(): Promise<string | null> {
  const res = await fetch(backendApi('site-settings'), { headers: authHeaders(), credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data?.storeId ?? null;
}

export function useCart(_steamId?: string | null, _discordId?: string | null) {
  const query = useQuery({
    queryKey: ['storefront', 'cart'],
    queryFn: async () => {
      if (!getAuthToken()) return emptyCart;
      const storeId = await getStoreId();
      if (!storeId) return emptyCart;
      const token = await getPayNowCustomerToken();
      if (!token) return emptyCart;
      const res = await fetch(`${PAYNOW_BASE}/store/cart`, {
        headers: {
          Authorization: `customer ${token}`,
          'x-paynow-store-id': storeId,
          Accept: 'application/json',
        },
        credentials: 'omit',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return emptyCart;
      const cart = data?.data ?? data;
      return Array.isArray(cart?.lines) ? cart : emptyCart;
    },
    staleTime: 60 * 1000,
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
      const storeId = await getStoreId();
      if (!storeId) throw new Error('Store not configured.');
      const token = await getPayNowCustomerToken();
      if (!token) throw new Error('Sign in to add to cart.');
      let url = `${PAYNOW_BASE}/store/cart/lines?product_id=${encodeURIComponent(payload.productId)}&quantity=${payload.qty}`;
      if (payload.gameServerId) url += `&gameserver_id=${encodeURIComponent(payload.gameServerId)}`;
      if (payload.subscription !== undefined) url += `&subscription=${payload.subscription ? '1' : '0'}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `customer ${token}`,
          'x-paynow-store-id': storeId,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data?.message ?? data?.error ?? 'Failed to update cart.') as string;
        throw new Error(msg);
      }
      const cart = data?.data ?? data;
      return { cart: Array.isArray(cart?.lines) ? cart : { lines: [], total: 0 } };
    },
    onSuccess: (data) => {
      if (data?.cart != null) {
        queryClient.setQueriesData({ queryKey: ['storefront', 'cart'] }, () => data.cart);
      }
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
      const storeId = await getStoreId();
      if (!storeId) throw new Error('Store not configured.');
      const token = await getPayNowCustomerToken();
      if (!token) throw new Error('Sign in to checkout.');
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const returnUrl =
        payload?.return_url ?? `${baseUrl}/store/complete?return_url=${encodeURIComponent(`${baseUrl}/store?success=true`)}`;
      const body = {
        lines: payload?.lines ?? [],
        return_url: returnUrl,
        success_url: returnUrl,
        auto_redirect: false,
      };
      const res = await fetch(`${PAYNOW_BASE}/checkouts`, {
        method: 'POST',
        headers: {
          Authorization: `customer ${token}`,
          'x-paynow-store-id': storeId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data?.message ?? data?.error ?? 'Checkout failed') as string;
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
      return Array.isArray(data?.data) ? data.data : [];
    },
    staleTime: 60 * 1000,
  });
  return { data: query.data ?? [], isLoading: query.isLoading, isSuccess: query.isSuccess };
}

export function useSubscriptions() {
  const query = useQuery({
    queryKey: ['storefront', 'subscriptions'],
    queryFn: async () => {
      const res = await fetch(backendApi('store/subscriptions'), { headers: authHeaders(), credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.data) ? data.data : [];
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
