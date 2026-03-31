'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';
import { parsePageTheme } from '@/lib/parse-page-theme';
import { withLeaderboardDefaults } from '@/lib/leaderboard-theme-defaults';

async function fetchLeaderboardTheme(): Promise<Record<string, unknown>> {
  const res = await fetch(backendApi('data?include=pageTheme:leaderboard'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return {};
  const data = await res.json();
  const pageTheme = data?.pageTheme;
  const settings = pageTheme && typeof pageTheme === 'object' && 'settings' in pageTheme ? pageTheme.settings : undefined;
  return parsePageTheme(settings, 'leaderboard');
}

export function useLeaderboardTheme() {
  const query = useQuery({
    queryKey: ['pageTheme', 'leaderboard'],
    queryFn: fetchLeaderboardTheme,
    staleTime: 60 * 1000,
  });
  const raw = query.data;
  return {
    data: raw != null ? withLeaderboardDefaults(raw as object) : undefined,
    isLoading: query.isLoading,
    error: query.error,
  };
}
