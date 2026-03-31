"use client";

import { useServerTheme } from "@/hooks/use-server-theme";

interface ServerTitlesProps {
  serverTheme?: Record<string, unknown>;
}

export function ServerTitles({ serverTheme }: ServerTitlesProps) {
  const { data: clientTheme } = useServerTheme();
  const theme = (clientTheme ?? serverTheme) as Record<string, unknown> | undefined;

  const titleColor = (theme?.titleTextColor ?? theme?.titleColor ?? "#f8fafc") as string;
  const subtitleColor = (theme?.subtitleColor ?? "#8e9db1") as string;

  return (
    <header
      className="mb-2 rounded-lg border border-border bg-transparent p-4 md:p-5"
      style={{ color: (theme?.textPrimaryColor as string) ?? undefined }}
    >
      <h2
        className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-xl font-bold tracking-tight text-white md:text-2xl"
        style={{ color: titleColor }}
      >
        <span>Servers</span>
        <span className="shrink-0 font-semibold opacity-80">· Server list</span>
      </h2>
      <p
        className="mt-2 max-w-[80ch] text-sm leading-relaxed md:text-[15px]"
        style={{ color: subtitleColor }}
      >
        Join the action with one click — connect to any server below.
      </p>
    </header>
  );
}
