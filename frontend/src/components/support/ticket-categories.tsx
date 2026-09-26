"use client";

import { backendApi } from "@/lib/api";
import { CategoryWithId } from "@/types/tickets";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { signIn } from "@/lib/laravel-auth-react";
import { useRouter } from "next/navigation";
import { useSupportTheme } from "@/hooks/use-support-theme";
import {
  SUPPORT_CARD_PALETTES,
  withSupportDefaults,
} from "@/lib/layout-theme-defaults";
import { HomeCardCorners } from "@/components/home/home-card-corners";

interface TicketCategoriesProps {
  isSignedIn: boolean;
  serverTheme?: Record<string, unknown>;
}

function splitDescription(description?: string | null): { body: string; meta: string } {
  const raw = (description || "").trim();
  if (!raw) return { body: "", meta: "" };
  const [first, ...rest] = raw.split(/\n+/);
  return { body: first.trim(), meta: rest.join(" ").trim() };
}

function iconForCategory(category: CategoryWithId, index: number): string {
  const icon = typeof category.icon === "string" ? category.icon : "";
  if (icon.startsWith("/") || icon.startsWith("http")) return icon;
  const byKey = SUPPORT_CARD_PALETTES.find((palette) => palette.key === icon);
  if (byKey) return byKey.icon;
  const slug = (category.slug || "").toLowerCase();
  if (slug.includes("general")) return SUPPORT_CARD_PALETTES[0].icon;
  if (slug.includes("bug")) return SUPPORT_CARD_PALETTES[2].icon;
  if (slug.includes("player") || slug.includes("report")) return SUPPORT_CARD_PALETTES[1].icon;
  if (slug.includes("payment") || slug.includes("billing")) return SUPPORT_CARD_PALETTES[3].icon;
  if (slug.includes("staff") || slug.includes("apply")) return SUPPORT_CARD_PALETTES[4].icon;
  return SUPPORT_CARD_PALETTES[index % SUPPORT_CARD_PALETTES.length].icon;
}

function paletteForCategory(category: CategoryWithId, index: number) {
  const icon = typeof category.icon === "string" ? category.icon : "";
  const byKey = SUPPORT_CARD_PALETTES.find((palette) => palette.key === icon);
  if (byKey) return byKey;
  const slug = (category.slug || "").toLowerCase();
  if (slug.includes("general")) return SUPPORT_CARD_PALETTES[0];
  if (slug.includes("bug")) return SUPPORT_CARD_PALETTES[2];
  if (slug.includes("player") || slug.includes("report")) return SUPPORT_CARD_PALETTES[1];
  if (slug.includes("payment") || slug.includes("billing")) return SUPPORT_CARD_PALETTES[3];
  if (slug.includes("staff") || slug.includes("apply")) return SUPPORT_CARD_PALETTES[4];
  return SUPPORT_CARD_PALETTES[index % SUPPORT_CARD_PALETTES.length];
}

export default function TicketCategories({ isSignedIn, serverTheme }: TicketCategoriesProps) {
  const { data: clientTheme } = useSupportTheme();
  const theme = withSupportDefaults(clientTheme || serverTheme);
  const router = useRouter();
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["ticket-categories"],
    queryFn: async () => {
      const res = await fetch(backendApi("support"), { credentials: "include" });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: theme.loadingSpinnerColor }} />
        <p className="pt-4 text-sm" style={{ color: theme.subtitleColor }}>
          Loading categories
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p style={{ color: theme.errorTextColor }}>Error loading categories: {error.message}</p>
      </div>
    );
  }

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return (
      <div className="py-16 text-center">
        <p style={{ color: theme.helpTextColor }}>No categories found</p>
      </div>
    );
  }

  const handleCategoryClick = (category: CategoryWithId) => {
    if (!isSignedIn) {
      signIn("steam");
      return;
    }
    router.push(`/support/${category.slug}`);
  };

  return (
    <div className="flex flex-wrap items-start justify-center gap-10 pt-[46px]">
      {categories.map((category: CategoryWithId, index: number) => {
        const palette = paletteForCategory(category, index);
        const { body, meta } = splitDescription(category.description);
        const number = String(index + 1).padStart(2, "0");
        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => handleCategoryClick(category)}
            className="support-ticket-card ghost group relative h-[200px] w-full max-w-[330px] shrink-0 overflow-visible text-left"
            style={{
              border: `1px solid ${theme.categoryCardBorder}`,
              borderRadius: theme.cardBorderRadius,
              ["--support-accent" as string]: palette.accent,
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(127.57deg, ${palette.wash} 8.5%, rgba(8, 12, 17, 0.94) 91.5%)`,
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(186, 145, 66, 0.06) 0%, rgba(186, 145, 66, 0) 25%), linear-gradient(180deg, rgba(255, 255, 255, 0.043) 0%, rgba(255, 255, 255, 0) 20%)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.04)]"
            />

            <span className="relative flex h-full flex-col px-5 py-5">
              <span className="flex items-center justify-between">
                <img src={iconForCategory(category, index)} alt="" width={28} height={28} />
                <span
                  className="support-ticket-number text-[9px] font-medium tracking-[1px]"
                  style={{ color: palette.accent }}
                >
                  {number}
                </span>
              </span>
              <span className="support-ticket-title pt-[27px] text-[18px] leading-[27px] tracking-[-0.6px]">
                {category.name}
              </span>
              <span
                className="pt-[7px] text-[12px] leading-[18px]"
                style={{ color: theme.categoryCardBodyColor }}
              >
                {body || "Open a ticket with our support team."}
              </span>
              <span className="mt-auto flex items-end justify-between pt-4">
                <span className="text-[9px] leading-[13.5px]" style={{ color: theme.categoryCardMetaColor }}>
                  {meta || (isSignedIn ? "Open a ticket" : "Sign in to continue")}
                </span>
                <span
                  className="flex items-center gap-1 text-[10px] font-medium leading-[15px]"
                  style={{ color: theme.categoryCardIconColor }}
                >
                  {theme.openTicketLabel}
                  <span className="support-ticket-arrow text-[14px] leading-[21px]">→</span>
                </span>
              </span>
            </span>
            <HomeCardCorners color={palette.accent} show />
          </button>
        );
      })}
    </div>
  );
}
