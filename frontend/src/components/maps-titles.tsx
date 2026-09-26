"use client";

import { MAPS_THEME_DEFAULTS, withMapsDefaults } from "@/lib/maps-theme-defaults";
import { useMapsThemeContext } from "./maps-theme-provider";
import { useMapsTheme } from "@/hooks/use-maps-theme";

interface MapsTitlesProps {
  serverTheme?: Record<string, unknown>;
}

export function MapsTitles({ serverTheme }: MapsTitlesProps) {
  const contextTheme = useMapsThemeContext();
  const { data: clientTheme } = useMapsTheme();
  const theme = withMapsDefaults(contextTheme || clientTheme || serverTheme);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
        <p
          data-theme-field="kickerLabel"
          data-theme-label="Hero kicker"
          className="support-hero-kicker font-mono text-[11px] font-medium leading-[11px] tracking-[2.6px]"
        >
          {theme.kickerLabel || MAPS_THEME_DEFAULTS.kickerLabel}
        </p>
        <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
      </div>
      <h1
        data-theme-field="pageTitle"
        data-theme-label="Hero title"
        className="support-hero-title pt-3.5 text-[40px] font-bold leading-[49px] tracking-[-2.25px] sm:text-[50px]"
      >
        {theme.pageTitle || MAPS_THEME_DEFAULTS.pageTitle}
      </h1>
      {theme.pageSubtitle ? (
        <p
          data-theme-field="pageSubtitle"
          data-theme-label="Hero subtitle"
          className="support-hero-subtitle max-w-[555px] pt-2.5 text-[14px] leading-[22.4px]"
        >
          {theme.pageSubtitle}
        </p>
      ) : null}
    </div>
  );
}
