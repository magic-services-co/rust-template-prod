'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';
import { parsePageTheme } from '@/lib/parse-page-theme';
import { usePageThemeDraft } from '@/hooks/use-page-theme-draft';

async function fetchStoreTheme(): Promise<Record<string, unknown>> {
  const res = await fetch(backendApi('data?include=pageTheme:store'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return {};
  const data = await res.json();
  const pageTheme = data?.pageTheme;
  const settings = pageTheme && typeof pageTheme === 'object' && 'settings' in pageTheme ? pageTheme.settings : undefined;
  return parsePageTheme(settings, 'store');
}

export function useStoreTheme() {
  const query = useQuery({
    queryKey: ['pageTheme', 'store'],
    queryFn: fetchStoreTheme,
    staleTime: 60 * 1000,
  });
  const draft = usePageThemeDraft('store');
  return {
    data: draft ?? query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
