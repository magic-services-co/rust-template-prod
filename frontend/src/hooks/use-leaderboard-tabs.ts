'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';

export type LeaderboardColumn = {
  columnKey: string;
  columnLabel: string;
  icon?: string | null;
  order?: number;
};

export type LeaderboardTab = {
  tabKey: string;
  tabLabel: string;
  columns: LeaderboardColumn[];
};

const DEFAULT_TABS: LeaderboardTab[] = [
  {
    tabKey: 'pvp_stats',
    tabLabel: 'PvP Stats',
    columns: [
      { columnKey: 'steam_id', columnLabel: 'Steam ID' },
      { columnKey: 'username', columnLabel: 'Username' },
      { columnKey: 'kdr', columnLabel: 'K/D' },
      { columnKey: 'time_played', columnLabel: 'Time Played' },
    ],
  },
];

async function fetchLeaderboardTabs(): Promise<LeaderboardTab[]> {
  const res = await fetch(backendApi('leaderboard/tabs'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) return DEFAULT_TABS;
  const json = await res.json();
  const data = json?.data ?? json?.tabs ?? json;
  if (Array.isArray(data) && data.length > 0) {
    return data.map((tab: Record<string, unknown>) => ({
      tabKey: String(tab.tabKey ?? tab.tab_key ?? ''),
      tabLabel: String(tab.tabLabel ?? tab.tab_label ?? ''),
      columns: Array.isArray(tab.columns)
        ? (tab.columns as LeaderboardColumn[])
        : [],
    }));
  }
  return DEFAULT_TABS;
}

export function useLeaderboardTabs() {
  const query = useQuery({
    queryKey: ['leaderboard-tabs'],
    queryFn: fetchLeaderboardTabs,
    staleTime: 60 * 1000,
  });
  return {
    data: query.data ?? DEFAULT_TABS,
    isLoading: query.isLoading,
    error: query.error,
  };
}
