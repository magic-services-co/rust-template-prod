"use client";

import { GiftIcon } from "lucide-react";
import StoreAlert from "@/app/(user)/store/store-alert";
import StoreOrderPanel from "@/components/store/store-order-panel";
import CheckGiftcardForm from "@/components/forms/check-giftcard-form";
import NeedSupport from "@/components/store/modules/need-support";
import { HomeCardCorners } from "@/components/home/home-card-corners";
import StoreCategoryTabs from "@/components/store/store-category-tabs";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useStoreTheme } from "@/hooks/use-store-theme";
import { STORE_THEME_DEFAULTS, withStoreDefaults } from "@/lib/layout-theme-defaults";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function StoreHero({
  theme,
  showSidebar,
  children,
}: {
  theme?: Record<string, unknown>;
  showSidebar: boolean;
  children: React.ReactNode;
}) {
  const { data: clientTheme } = useStoreTheme();
  const t = withStoreDefaults(clientTheme || theme);
  const { data: settings } = useSiteSettings();
  const siteName = (settings?.name || "Magic Rust").replace(/\s+/g, " ").trim();
  const pathname = usePathname();
  const showCategoryTabs = showSidebar && !pathname.startsWith("/store/complete");

  return (
    <>
      <div className="flex flex-col items-start justify-between gap-8 border-b border-[rgba(255,255,255,0.1)] pb-8 lg:flex-row lg:items-end">
        <div className="max-w-[576px]">
          <p
            data-theme-field="kickerLabel"
            data-theme-label="Hero kicker"
            className="store-hero-kicker text-[10px] font-medium leading-[15px] tracking-[2.4px]"
          >
            {t.kickerLabel || STORE_THEME_DEFAULTS.kickerLabel}
          </p>
          <h1 className="store-hero-title pt-3 text-[40px] font-extrabold leading-[1] tracking-[-3.2px] sm:text-[60px] sm:leading-[60px] sm:tracking-[-4.8px]">
            <span data-theme-field="pageTitle" data-theme-label="Hero title">
              {t.pageTitle || STORE_THEME_DEFAULTS.pageTitle}{" "}
            </span>
            <span
              data-theme-field="pageTitleAccent"
              data-theme-label="Hero gold words"
              className="store-hero-title-accent"
            >{t.pageTitleAccent || STORE_THEME_DEFAULTS.pageTitleAccent}</span>
          </h1>
          <p
            data-theme-field="pageSubtitle"
            data-theme-label="Hero subtitle"
            className="store-hero-subtitle max-w-[448px] pt-4 text-[14px] leading-6"
          >
            {(t.pageSubtitle || STORE_THEME_DEFAULTS.pageSubtitle).replace(/Magic Rust/g, siteName)}
          </p>
        </div>
        <StoreAlert theme={t} />
      </div>

      <div className={cn("grid gap-8 pt-8", showSidebar && "lg:grid-cols-[minmax(0,1fr)_280px]")}>
        <div className="flex min-w-0 flex-col">
            {showCategoryTabs ? (
              <div className="pb-5">
                <StoreCategoryTabs theme={t} />
              </div>
            ) : null}
            {children}
          </div>
        {showSidebar && (
          <aside className="flex w-full flex-col lg:max-w-[280px]">
            <StoreOrderPanel theme={t} />
            <div className="pt-4">
              <NeedSupport theme={t} />
            </div>
            <p className="store-order-meta mt-4 border-l border-[rgba(186,145,66,0.7)] pl-3 text-[10px] leading-5">
              {t.perksNote}
            </p>
            <div
              className="relative mt-4 overflow-visible border p-5"
              style={{
                backgroundColor: t.sidebarBackground,
                borderColor: t.sidebarBorder,
                ["--store-sidebar-title" as string]: t.sidebarTitleColor,
                ["--store-sidebar-name" as string]: t.sidebarSelectedNameColor,
                ["--store-sidebar-price" as string]: t.sidebarPriceColor,
                ["--store-sidebar-text" as string]: t.sidebarTextColor,
              }}
            >
              <p className="store-order-kicker flex items-center gap-2 text-[9px] font-bold tracking-[1.62px]">
                <GiftIcon className="size-3.5" />
                GIFT CARD
              </p>
              <div className="pt-3">
                <CheckGiftcardForm theme={t} />
              </div>
              <HomeCardCorners color="#ba9142" show />
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
