'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';
import { buildServersPageThemeFromApiPayloads } from '@/lib/merge-servers-leaderboard-theme';

async function fetchServerTheme(): Promise<Record<string, unknown>> {
  const [serversRes, leaderboardRes] = await Promise.all([
    fetch(backendApi('data?include=pageTheme:servers'), {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    }),
    fetch(backendApi('data?include=pageTheme:leaderboard'), {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    }),
  ]);
  const serversPayload = serversRes.ok ? await serversRes.json() : {};
  const leaderboardPayload = leaderboardRes.ok ? await leaderboardRes.json() : {};
  return buildServersPageThemeFromApiPayloads(serversPayload, leaderboardPayload);
}

export function useServerTheme() {
  const query = useQuery({
    queryKey: ['pageTheme', 'servers', 'merged-leaderboard'],
    queryFn: fetchServerTheme,
    staleTime: 60 * 1000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
