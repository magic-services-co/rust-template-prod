"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useMapsTheme } from "@/hooks/use-maps-theme";
import { withMapsDefaults } from "@/lib/maps-theme-defaults";

const MapsThemeContext = createContext<ReturnType<typeof withMapsDefaults> | null>(null);

export function MapsThemeProvider({
  children,
  serverTheme,
}: {
  children: ReactNode;
  serverTheme?: Record<string, unknown>;
}) {
  const { data: clientTheme } = useMapsTheme();
  const theme = withMapsDefaults(clientTheme || serverTheme);
  return <MapsThemeContext.Provider value={theme}>{children}</MapsThemeContext.Provider>;
}

export function useMapsThemeContext() {
  return useContext(MapsThemeContext);
}
