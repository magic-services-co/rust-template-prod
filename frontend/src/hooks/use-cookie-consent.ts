'use client';

import { useState, useEffect, useCallback } from 'react';
import { backendApi } from '@/lib/api';

export type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

type Status = 'pending' | 'accepted' | 'denied' | 'custom';

const COOKIE_CONSENT_STORAGE_KEY = 'cookie_consent';

const defaultConsent: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

type Snapshot = { isLoaded: boolean; status: Status; consent: CookieConsent };

let snapshot: Snapshot = {
  isLoaded: false,
  status: 'pending',
  consent: defaultConsent,
};

const listeners = new Set<() => void>();

function emit(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function getStoredConsent(): { status: Status; consent: CookieConsent } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { status?: Status; consent?: CookieConsent };
    if (!parsed || parsed.status === 'pending') return null;
    return {
      status: parsed.status ?? 'accepted',
      consent: {
        necessary: true,
        analytics: parsed.consent?.analytics ?? false,
        marketing: parsed.consent?.marketing ?? false,
        preferences: parsed.consent?.preferences ?? false,
      },
    };
  } catch {
    return null;
  }
}

function setStoredConsent(status: Status, consent: CookieConsent): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify({ status, consent }));
  } catch {
    // ignore
  }
}

async function fetchConsent(): Promise<{ status: Status; consent: CookieConsent } | null> {
  try {
    const res = await fetch(backendApi('cookie-consent'), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const status = data.status ?? 'pending';
    const consent = {
      necessary: true,
      analytics: data.consent?.analytics ?? false,
      marketing: data.consent?.marketing ?? false,
      preferences: data.consent?.preferences ?? false,
    };
    return { status, consent };
  } catch {
    return null;
  }
}

async function saveConsent(status: Status, consent: CookieConsent): Promise<boolean> {
  setStoredConsent(status, consent);
  try {
    const res = await fetch(backendApi('cookie-consent'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status, consent }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let loadStarted = false;

function ensureLoaded() {
  if (loadStarted) return;
  loadStarted = true;
  fetchConsent().then((data) => {
    if (data && data.status !== 'pending') {
      emit({ isLoaded: true, status: data.status, consent: data.consent });
      return;
    }
    const stored = getStoredConsent();
    if (stored) {
      emit({ isLoaded: true, status: stored.status, consent: stored.consent });
      return;
    }
    emit({
      isLoaded: true,
      status: data?.status ?? 'pending',
      consent: data?.consent ?? defaultConsent,
    });
  });
}

export function useCookieConsent() {
  const [state, setState] = useState<Snapshot>(snapshot);

  useEffect(() => {
    const listener = () => setState(snapshot);
    listeners.add(listener);
    ensureLoaded();
    setState(snapshot);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const hasConsent = useCallback((category: 'necessary' | 'analytics' | 'marketing' | 'preferences') => {
    if (category === 'necessary') return true;
    return snapshot.consent[category] ?? false;
  }, [state.consent]);

  const getStatus = useCallback((): Status => snapshot.status, [state.status]);

  const getConsent = useCallback((): CookieConsent => ({ ...snapshot.consent }), [state.consent]);

  const acceptAll = useCallback(async () => {
    const all: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    const ok = await saveConsent('accepted', all);
    if (ok) emit({ consent: all, status: 'accepted' });
  }, []);

  const denyAll = useCallback(async () => {
    const ok = await saveConsent('denied', defaultConsent);
    if (ok) emit({ consent: defaultConsent, status: 'denied' });
  }, []);

  const acceptCustom = useCallback(async (custom: CookieConsent) => {
    const next: CookieConsent = {
      necessary: true,
      analytics: custom.analytics ?? false,
      marketing: custom.marketing ?? false,
      preferences: custom.preferences ?? false,
    };
    const ok = await saveConsent('custom', next);
    if (ok) emit({ consent: next, status: 'custom' });
  }, []);

  return {
    isLoaded: state.isLoaded,
    needsConsent: state.status === 'pending',
    hasConsent,
    getStatus,
    getConsent,
    acceptAll,
    denyAll,
    acceptCustom,
  };
}
