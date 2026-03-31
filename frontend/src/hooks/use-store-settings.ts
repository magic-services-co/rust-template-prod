'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';

export type StoreSettings = {
  featuredProductEnabled?: boolean;
  featuredProductId?: string | null;
  requireLinkedToPurchase?: boolean;
};

async function fetchStoreSettings(): Promise<StoreSettings | null> {
  const res = await fetch(backendApi('store-settings'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data as StoreSettings;
}

export const storeSettingsQueryKey = ['storeSettings'] as const;

export function useStoreSettings() {
  const query = useQuery({
    queryKey: storeSettingsQueryKey,
    queryFn: fetchStoreSettings,
    staleTime: 60 * 1000,
  });

  return {
    data: query.data ?? undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
