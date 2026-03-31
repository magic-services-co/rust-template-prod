'use client';

import { useEffect, useState } from 'react';

export function DiscordUserCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
    if (!base) {
      setCount(null);
      return;
    }
    const url = `${base.replace(/\/$/, '')}/api/discord-members`;
    fetch(url, { credentials: 'omit' })
      .then(res => res.json())
      .then(data => setCount(typeof data?.count === 'number' ? data.count : null))
      .catch(() => setCount(null));
  }, []);

  return (
    <span className="flex items-center gap-1.5">
      <span className="font-bold">{count !== null ? count : '...'}</span>
      <span>Discord Users</span>
    </span>
  );
}