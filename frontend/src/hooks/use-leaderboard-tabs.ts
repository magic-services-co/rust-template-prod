'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';

export type LeaderboardColumn = {
  columnKey: string;
  columnLabel: string;
  icon?: string | null;
  order?: number;
  format?: string | null;
};

export type LeaderboardTab = {
  tabKey: string;
  tabLabel: string;
  icon?: string | null;
  columns: LeaderboardColumn[];
};

const DEFAULT_TABS: LeaderboardTab[] = [];

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
      icon: tab.icon != null ? String(tab.icon) : null,
      columns: Array.isArray(tab.columns)
        ? (tab.columns as LeaderboardColumn[]).map((c) => ({
            columnKey: c.columnKey,
            columnLabel: c.columnLabel,
            icon: c.icon,
            order: c.order,
            format: c.format ?? null,
          }))
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
