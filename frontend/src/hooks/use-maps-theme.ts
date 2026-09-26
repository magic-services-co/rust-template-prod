'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';
import { parsePageTheme } from '@/lib/parse-page-theme';
import { usePageThemeDraft } from '@/hooks/use-page-theme-draft';

async function fetchMapsTheme(): Promise<Record<string, unknown>> {
  const res = await fetch(backendApi('data?include=pageTheme:maps'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return {};
  const data = await res.json();
  const pageTheme = data?.pageTheme;
  const settings = pageTheme && typeof pageTheme === 'object' && 'settings' in pageTheme ? pageTheme.settings : undefined;
  return parsePageTheme(settings, 'maps');
}

export function useMapsTheme() {
  const query = useQuery({
    queryKey: ['pageTheme', 'maps'],
    queryFn: fetchMapsTheme,
    staleTime: 60 * 1000,
  });
  const draft = usePageThemeDraft('maps');
  return {
    data: draft ?? query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
