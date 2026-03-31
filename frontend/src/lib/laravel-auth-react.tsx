'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signIn as laravelSignIn, signOut as laravelSignOut, getAuthToken } from '@/lib/laravel-auth';
import { backendApi } from '@/lib/api';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

type Session = { user?: Record<string, unknown> } | null;
type Status = 'loading' | 'authenticated' | 'unauthenticated';

type SessionContextValue = {
  data: Session;
  status: Status;
  update: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Session>(null);
  const [status, setStatus] = useState<Status>('loading');

  const update = useCallback(async () => {
    try {
      const res = await fetch(backendApi('auth/session'), {
        credentials: 'include',
        cache: 'no-store',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json?.user) {
        setData({ user: json.user });
        setStatus('authenticated');
      } else {
        setData(null);
        setStatus('unauthenticated');
      }
    } catch {
      setData(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    update();
  }, [update]);

  const value: SessionContextValue = { data, status, update };
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function signIn(provider?: 'steam' | 'discord') {
  laravelSignIn(provider ?? 'steam');
}

export function signOut(options?: { callbackUrl?: string }) {
  laravelSignOut().then(() => {
    if (options?.callbackUrl) {
      window.location.href = options.callbackUrl;
    }
  });
}

export async function getSession(): Promise<Session> {
  const res = await fetch(backendApi('auth/session'), {
    credentials: 'include',
    cache: 'no-store',
    headers: authHeaders(),
  });
  const json = await res.json();
  return json?.user ? { user: json.user } : null;
}
