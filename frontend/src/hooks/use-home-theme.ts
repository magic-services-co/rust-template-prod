"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { parsePageTheme } from "@/lib/parse-page-theme";
import { subscribeHomeThemeDraft } from "@/lib/home-theme-store";
import { type HomeTheme, withHomeDefaults } from "@/lib/home-theme-defaults";

async function fetchHomeTheme(): Promise<Record<string, unknown>> {
  const res = await fetch(backendApi("data?include=pageTheme:home"), {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) return {};
  const data = await res.json();
  const pageTheme = data?.pageTheme;
  const raw =
    pageTheme && typeof pageTheme === "object" && "settings" in pageTheme
      ? (pageTheme as { settings: unknown }).settings
      : undefined;
  const settings =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw) as Record<string, unknown>;
          } catch {
            return {};
          }
        })()
      : raw && typeof raw === "object"
        ? (raw as Record<string, unknown>)
        : {};
  const home = parsePageTheme(settings, "home");
  const features =
    settings.features && typeof settings.features === "object" && !Array.isArray(settings.features)
      ? (settings.features as Record<string, unknown>)
      : {};
  return { ...home, ...features };
}

export function useHomeTheme(serverTheme?: Record<string, unknown> | null) {
  const query = useQuery({
    queryKey: ["pageTheme", "home"],
    queryFn: fetchHomeTheme,
    staleTime: 60 * 1000,
    initialData: serverTheme ?? undefined,
  });
  const [draft, setDraft] = useState<HomeTheme | null>(null);

  useEffect(() => subscribeHomeThemeDraft(setDraft), []);

  const theme = useMemo(
    () => draft ?? withHomeDefaults(query.data as Record<string, unknown> | undefined),
    [draft, query.data],
  );

  return {
    theme,
    isDraft: draft != null,
    isLoading: query.isLoading,
  };
}
