'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signIn } from '@/lib/laravel-auth-react';

type ErrorPayload = { error: string; message: string; hint: string } | null;

function getErrorFromUrl(): string {
  if (typeof window === 'undefined') return 'Default';
  const params = new URLSearchParams(window.location.search);
  return params.get('error')?.trim() || 'Default';
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ErrorPayload>(null);

  useEffect(() => {
    const errorCode = getErrorFromUrl();
    const urlMessage = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('message') : null;
    const query = new URLSearchParams({ error: errorCode });
    if (urlMessage) query.set('message', urlMessage);
    fetch(`/api/auth/error?${query.toString()}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() =>
        setData({
          error: 'Default',
          message: urlMessage || 'An error occurred during sign-in.',
          hint: 'Try again or return home.',
        })
      );
  }, [searchParams]);

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center space-y-6 max-w-lg px-4">
        <h1 className="text-4xl font-bold tracking-tight">Sign-in error</h1>
        {data ? (
          <>
            <p className="text-muted-foreground">{data.message}</p>
            <p className="text-xs text-muted-foreground/70">
              Error code: {data.error}
              {data.error === 'Default' && ' — Check the terminal where Next.js is running for the real error when you clicked Sign in.'}
            </p>
            {data.hint && (
              <p className="text-sm text-muted-foreground/90 bg-muted/50 rounded-md p-4 text-left">
                {data.hint}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Loading…</p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => signIn('steam')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Try again with Steam
          </button>
          {data?.error === 'OAuthError' && (
            <button
              type="button"
              onClick={() => signIn('discord')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-[#5865F2] text-white hover:bg-[#4752C4] h-10 px-4 py-2"
            >
              Try again with Discord
            </button>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
