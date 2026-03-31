'use client';

import { useEffect, useRef } from 'react';
import { useSession } from '@/lib/laravel-auth-react';
import { backendApi } from '@/lib/api';
import { getAuthToken } from '@/lib/laravel-auth';

const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

async function updateLastSeen(): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch(backendApi('auth/last-seen'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Auth-Token': token,
      },
      credentials: 'include',
    });
  } catch {
    // ignore network errors
  }
}

export function useUserActivity(): void {
  const { data: session, status } = useSession();
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const maybeUpdate = (): void => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= LAST_SEEN_THROTTLE_MS) {
        lastUpdateRef.current = now;
        updateLastSeen();
      }
    };

    maybeUpdate();
    intervalRef.current = setInterval(maybeUpdate, LAST_SEEN_THROTTLE_MS);

    const handleActivity = (): void => maybeUpdate();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [session?.user, status]);
}
