'use client';

import { useQuery } from '@tanstack/react-query';
import { backendApi } from '@/lib/api';

export const LINKED_USERS_COUNT_QUERY_KEY = ['linked-users-count'] as const;

async function fetchLinkedUsersCount(): Promise<number> {
  const res = await fetch(backendApi('linked-users-count'), { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Failed to fetch count');
  return data.count ?? 0;
}

export function LinkedUsersCount() {
  const { data: count, isPending } = useQuery({
    queryKey: LINKED_USERS_COUNT_QUERY_KEY,
    queryFn: fetchLinkedUsersCount,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  return (
    <div 
      className="select-none text-center my-4 py-2 px-2 rounded-lg transition-all duration-300"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
      }}
    >
      <h1 style={{ color: '#e5e7eb' }}>
        <span className="font-extrabold px-0.5 text-[#e5e7eb]">
          {count != null ? count.toLocaleString() : (isPending ? '...' : '—')}
        </span>
{' '}linked users
      </h1>
    </div>
  );
}
