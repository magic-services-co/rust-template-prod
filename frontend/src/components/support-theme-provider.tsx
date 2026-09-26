"use client";

import { useSupportTheme } from "@/hooks/use-support-theme";
import { withSupportDefaults } from "@/lib/layout-theme-defaults";

interface SupportThemeProviderProps {
  children: React.ReactNode;
  serverTheme?: Record<string, unknown>;
}

export function SupportThemeProvider({ children, serverTheme }: SupportThemeProviderProps) {
  const { data: clientTheme } = useSupportTheme();
  const theme = withSupportDefaults(clientTheme || serverTheme);

  const surface =
    !theme.backgroundColor || theme.backgroundColor === "transparent"
      ? "#05070a"
      : theme.backgroundColor;

  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        backgroundColor: surface,
        backdropFilter: theme.blurIntensity ? `blur(${theme.blurIntensity * 10}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
}
