'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';
import { parsePageTheme } from '@/lib/parse-page-theme';

async function fetchSupportTheme(): Promise<Record<string, unknown>> {
  const res = await fetch(backendApi('data?include=pageTheme:support'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return {};
  const data = await res.json();
  const pageTheme = data?.pageTheme;
  const settings = pageTheme && typeof pageTheme === 'object' && 'settings' in pageTheme ? pageTheme.settings : undefined;
  return parsePageTheme(settings, 'support');
}

export function useSupportTheme() {
  const query = useQuery({
    queryKey: ['pageTheme', 'support'],
    queryFn: fetchSupportTheme,
    staleTime: 60 * 1000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
