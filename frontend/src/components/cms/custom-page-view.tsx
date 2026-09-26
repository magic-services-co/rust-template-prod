"use client";

import { SupportPageShell } from "@/components/support/support-page-shell";
import { HomeCardCorners } from "@/components/home/home-card-corners";
import { ClientServerPageContentDynamic } from "@/components/server-page-content-dynamic";
import { useSavedPageTheme } from "@/hooks/use-saved-page-theme";
import { CMS_THEME_DEFAULTS, mergeThemeDefaults } from "@/lib/live-page-theme";

function splitTitle(title: string): { lead: string; accent: string } {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lead: "", accent: "PAGE" };
  if (words.length === 1) return { lead: "", accent: words[0] };
  return { lead: words.slice(0, -1).join(" "), accent: words[words.length - 1] };
}

export function CustomPageView({
  title,
  kicker = "PAGE",
  subtitle,
  content,
}: {
  title: string;
  kicker?: string;
  subtitle?: string;
  content: unknown;
}) {
  const { lead, accent } = splitTitle(title);
  const { data } = useSavedPageTheme("cms");
  const t = mergeThemeDefaults({ ...CMS_THEME_DEFAULTS }, data) as typeof CMS_THEME_DEFAULTS;

  return (
    <SupportPageShell>
      <div
        className="cms-page"
        style={{
          ["--support-kicker" as string]: t.kickerColor,
          ["--support-title" as string]: t.titleColor,
          ["--support-subtitle" as string]: t.subtitleColor,
          ["--cms-accent" as string]: t.accentColor,
          ["--cms-card-bg" as string]: t.cardBackground,
          ["--cms-card-border" as string]: t.cardBorder,
          ["--cms-heading" as string]: t.headingColor,
          ["--cms-body" as string]: t.bodyColor,
          ["--cms-link" as string]: t.linkColor,
          ["--cms-code" as string]: t.codeColor,
        }}
        data-cms-corners={t.showCorners ? "on" : "off"}
      >
        <div className="border-b border-[rgba(255,255,255,0.1)] pb-10">
          <p
            data-theme-field="kickerColor"
            data-theme-label="Kicker"
            className="support-hero-kicker font-mono text-[10px] font-medium leading-[10px] tracking-[1.45px]"
          >
            {kicker.toUpperCase()}
          </p>
          <h1 className="support-hero-title pt-2.5 text-[40px] font-extrabold leading-[48px] tracking-[-2.4px] sm:text-[56px] sm:leading-[60px] lg:text-[62px] lg:leading-[62px] lg:tracking-[-2.9px]">
            {lead ? (
              <span data-theme-field="titleColor" data-theme-label="Title">
                {lead.toUpperCase()}{" "}
              </span>
            ) : null}
            <span
              data-theme-field="accentColor"
              data-theme-label="Gold words"
              style={{ color: t.accentColor }}
            >
              {accent.toUpperCase()}
            </span>
          </h1>
          {subtitle ? (
            <p
              data-theme-field="subtitleColor"
              data-theme-label="Subtitle"
              className="support-hero-subtitle max-w-[640px] pt-4 text-[14px] leading-[22px]"
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        <div
          className="cms-page-card relative mt-10 border p-6 sm:p-8"
          data-theme-field="cardBackground"
          data-theme-label="Card fill"
          style={{
            backgroundColor: t.cardBackground,
            borderColor: t.cardBorder,
          }}
        >
          <div className="cms-page-body">
            <ClientServerPageContentDynamic content={content} />
          </div>
          <HomeCardCorners color={t.cornerColor} show={Boolean(t.showCorners)} />
        </div>
      </div>
    </SupportPageShell>
  );
}
