'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setAuthCookie } from '@/lib/laravel-auth';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'storing' | 'done' | 'error'>('storing');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token?.trim()) {
      setStatus('error');
      return;
    }
    setAuthCookie(token.trim());
    setStatus('done');
    const setupNext =
      typeof window !== 'undefined' ? sessionStorage.getItem('setup_wizard_post_auth_redirect') : null;
    if (setupNext) {
      sessionStorage.removeItem('setup_wizard_post_auth_redirect');
      window.location.replace(setupNext);
      return;
    }
    window.location.replace('/');
  }, [searchParams]);

  if (status === 'error') {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Missing token. Please try signing in again.</p>
        <a href="/" className="mt-4 text-primary underline">Return home</a>
      </main>
    );
  }

  return null;
}
