"use client";

import Link from "next/link";
import { useSupportTheme } from "@/hooks/use-support-theme";
import { SUPPORT_THEME_DEFAULTS, withSupportDefaults } from "@/lib/layout-theme-defaults";

interface SupportTitlesProps {
  serverTheme?: Record<string, unknown>;
  isSignedIn?: boolean;
  kicker?: string;
  title?: string;
  subtitle?: string;
}

export function SupportTitles({
  serverTheme,
  isSignedIn,
  kicker,
  title,
  subtitle,
}: SupportTitlesProps) {
  const { data: clientTheme } = useSupportTheme();
  const theme = withSupportDefaults(clientTheme || serverTheme);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
        <p
          data-theme-field="kickerLabel"
          data-theme-label="Hero kicker"
          className="support-hero-kicker font-mono text-[11px] font-medium leading-[11px] tracking-[2.6px]"
        >
          {kicker || theme.kickerLabel || SUPPORT_THEME_DEFAULTS.kickerLabel}
        </p>
        <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
      </div>
      <h1
        data-theme-field="pageTitle"
        data-theme-label="Hero title"
        className="support-hero-title pt-3.5 text-[40px] font-bold leading-[49px] tracking-[-2.25px] sm:text-[50px]"
      >
        {title || theme.pageTitle || SUPPORT_THEME_DEFAULTS.pageTitle}
      </h1>
      <p
        data-theme-field="pageSubtitle"
        data-theme-label="Hero subtitle"
        className="support-hero-subtitle max-w-[555px] pt-2.5 text-[14px] leading-[22.4px]"
      >
        {subtitle || theme.pageSubtitle || SUPPORT_THEME_DEFAULTS.pageSubtitle}
      </p>
      {isSignedIn && (
        <Link
          href="/profile?tab=tickets"
          className="pt-3 text-[11px] font-medium tracking-[0.4px] underline-offset-4 hover:underline"
          style={{ color: theme.kickerColor }}
        >
          View my tickets
        </Link>
      )}
    </div>
  );
}
