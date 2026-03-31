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
    localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({ status, consent })
    );
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

export function useCookieConsent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [status, setStatus] = useState<Status>('pending');
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent);

  useEffect(() => {
    let cancelled = false;
    fetchConsent().then((data) => {
      if (cancelled) return;
      if (data && data.status !== 'pending') {
        setStatus(data.status);
        setConsent(data.consent);
      } else {
        const stored = getStoredConsent();
        if (stored) {
          setStatus(stored.status);
          setConsent(stored.consent);
        } else if (data) {
          setStatus(data.status);
          setConsent(data.consent);
        }
      }
      setIsLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const hasConsent = useCallback(
    (category: 'necessary' | 'analytics' | 'marketing' | 'preferences') => {
      if (category === 'necessary') return true;
      return consent[category] ?? false;
    },
    [consent]
  );

  const getStatus = useCallback((): Status => status, [status]);

  const getConsent = useCallback((): CookieConsent => ({ ...consent }), [consent]);

  const needsConsent = status === 'pending';

  const acceptAll = useCallback(async () => {
    const all: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    const ok = await saveConsent('accepted', all);
    if (ok) {
      setConsent(all);
      setStatus('accepted');
    }
  }, []);

  const denyAll = useCallback(async () => {
    const ok = await saveConsent('denied', defaultConsent);
    if (ok) {
      setConsent(defaultConsent);
      setStatus('denied');
    }
  }, []);

  const acceptCustom = useCallback(async (custom: CookieConsent) => {
    const next: CookieConsent = {
      necessary: true,
      analytics: custom.analytics ?? false,
      marketing: custom.marketing ?? false,
      preferences: custom.preferences ?? false,
    };
    const ok = await saveConsent('custom', next);
    if (ok) {
      setConsent(next);
      setStatus('custom');
    }
  }, []);

  return {
    isLoaded,
    needsConsent,
    hasConsent,
    getStatus,
    getConsent,
    acceptAll,
    denyAll,
    acceptCustom,
  };
}
