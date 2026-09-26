'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';
import { parsePageTheme } from '@/lib/parse-page-theme';
import { usePageThemeDraft } from '@/hooks/use-page-theme-draft';

async function fetchProfileTheme(): Promise<Record<string, unknown>> {
  const res = await fetch(backendApi('data?include=pageTheme:profile'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return {};
  const data = await res.json();
  const pageTheme = data?.pageTheme;
  const settings = pageTheme && typeof pageTheme === 'object' && 'settings' in pageTheme ? pageTheme.settings : undefined;
  return parsePageTheme(settings, 'profile');
}

export function useProfileTheme() {
  const query = useQuery({
    queryKey: ['pageTheme', 'profile'],
    queryFn: fetchProfileTheme,
    staleTime: 60 * 1000,
  });
  const draft = usePageThemeDraft('profile');
  return {
    data: draft ?? query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
