'use client';

import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { Analytics } from '@vercel/analytics/react';

export function ConditionalAnalytics() {
  const { hasConsent, isLoaded } = useCookieConsent();

  if (!isLoaded) {
    return null;
  }

  if (!hasConsent('analytics')) {
    return null;
  }

  return <Analytics />;
} 