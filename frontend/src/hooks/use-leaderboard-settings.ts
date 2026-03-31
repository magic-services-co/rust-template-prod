'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';

export type LeaderboardSettings = {
  showWipeSelection?: boolean;
};

async function fetchLeaderboardSettings(): Promise<LeaderboardSettings> {
  const res = await fetch(backendApi('leaderboard-settings'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return { showWipeSelection: true };
  const data = await res.json();
  return {
    showWipeSelection: data?.showWipeSelection !== false,
  };
}

export function useLeaderboardSettings() {
  const query = useQuery({
    queryKey: ['leaderboard-settings'],
    queryFn: fetchLeaderboardSettings,
    staleTime: 60 * 1000,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
