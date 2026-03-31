import { backendApi } from '@/lib/api';

const AUTH_COOKIE_NAME = 'auth_token';
const AUTH_COOKIE_MAX_AGE_DAYS = 365;

export function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
  try {
    localStorage.removeItem('paynow-customer-token');
  } catch {
    // ignore
  }
}

export function signIn(provider: 'steam' | 'discord'): void {
  if (typeof window === 'undefined') return;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = origin
    ? `${backendApi(`auth/redirect/${provider}`)}?return_origin=${encodeURIComponent(origin)}`
    : backendApi(`auth/redirect/${provider}`);
  window.location.href = url;
}

export function signOut(): Promise<void> {
  const token = typeof document !== 'undefined' ? getAuthToken() : null;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(backendApi('auth/signout'), {
    method: 'POST',
    credentials: 'include',
    headers,
  }).then(() => {
    clearAuthCookie();
    return undefined;
  });
}
