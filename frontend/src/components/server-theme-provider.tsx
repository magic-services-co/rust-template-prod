"use client";

import { useServerTheme } from "@/hooks/use-server-theme";
import { withUserDefaults } from "@/lib/user-theme-defaults";

interface ServerThemeProviderProps {
  children: React.ReactNode;
  /** SSR merged theme (leaderboard + servers); client hook refines the same shape. */
  serverTheme?: Record<string, unknown>;
}

export function ServerThemeProvider({ children, serverTheme }: ServerThemeProviderProps) {
  const { data: clientTheme } = useServerTheme();

  const base = withUserDefaults(undefined);
  const raw = clientTheme ?? serverTheme;
  const theme =
    raw != null && typeof raw === "object" && !Array.isArray(raw)
      ? { ...base, ...raw }
      : base;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: (theme.backgroundColor as string | undefined) ?? "transparent",
        backdropFilter: theme.blurIntensity
          ? `blur(${Number(theme.blurIntensity) * 10}px)`
          : undefined,
        transition: "all 0.3s ease-in-out",
      }}
    >
      {children}
    </div>
  );
}
