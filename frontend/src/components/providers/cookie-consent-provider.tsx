'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useCookieConsent } from '@/hooks/use-cookie-consent';

interface CookieConsentContextType {
  hasConsent: (category: 'necessary' | 'analytics' | 'marketing' | 'preferences') => boolean;
  getStatus: () => 'pending' | 'accepted' | 'denied' | 'custom';
  getConsent: () => {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
  };
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export function useCookieConsentContext() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsentContext must be used within a CookieConsentProvider');
  }
  return context;
}

interface CookieConsentProviderProps {
  children: ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const { hasConsent, getStatus, getConsent } = useCookieConsent();

  useEffect(() => {
    if (hasConsent('analytics')) {
      console.log('Analytics cookies accepted - loading analytics scripts');
    }
  }, [hasConsent]);

  useEffect(() => {
    if (hasConsent('marketing')) {
      console.log('Marketing cookies accepted - loading marketing scripts');
    }
  }, [hasConsent]);

  const contextValue: CookieConsentContextType = {
    hasConsent,
    getStatus,
    getConsent,
  };

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
    </CookieConsentContext.Provider>
  );
} 