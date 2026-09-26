"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useServerTheme } from "@/hooks/use-server-theme";
import { withServersDefaults } from "@/lib/servers-theme-defaults";

const ServerThemeContext = createContext<ReturnType<typeof withServersDefaults> | null>(null);

export function ServerThemeProvider({
  children,
  serverTheme,
}: {
  children: ReactNode;
  serverTheme?: Record<string, unknown>;
}) {
  const { data: clientTheme } = useServerTheme();
  const theme = withServersDefaults(clientTheme || serverTheme);
  return <ServerThemeContext.Provider value={theme}>{children}</ServerThemeContext.Provider>;
}

export function useServerThemeContext() {
  return useContext(ServerThemeContext);
}
