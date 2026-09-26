"use client";

import { SERVERS_THEME_DEFAULTS, withServersDefaults } from "@/lib/servers-theme-defaults";
import { useServerThemeContext } from "./server-theme-provider";
import { useServerTheme } from "@/hooks/use-server-theme";

interface ServerTitlesProps {
  serverTheme?: Record<string, unknown>;
}

export function ServerTitles({ serverTheme }: ServerTitlesProps) {
  const contextTheme = useServerThemeContext();
  const { data: clientTheme } = useServerTheme();
  const theme = withServersDefaults(contextTheme || clientTheme || serverTheme);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
        <p
          data-theme-field="kickerLabel"
          data-theme-label="Hero kicker"
          className="support-hero-kicker font-mono text-[11px] font-medium leading-[11px] tracking-[2.6px]"
        >
          {theme.kickerLabel || SERVERS_THEME_DEFAULTS.kickerLabel}
        </p>
        <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
      </div>
      <h1
        data-theme-field="pageTitle"
        data-theme-label="Hero title"
        className="support-hero-title pt-3.5 text-[40px] font-extrabold leading-[50px] tracking-[-2.4px] sm:text-[56px]"
      >
        {theme.pageTitle || SERVERS_THEME_DEFAULTS.pageTitle}
      </h1>
    </div>
  );
}
