"use client";

import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { parsePageTheme } from "@/lib/parse-page-theme";
import { usePageThemeDraft } from "@/hooks/use-page-theme-draft";

async function fetchPageTheme(slug: string): Promise<Record<string, unknown>> {
  const res = await fetch(backendApi(`data?include=pageTheme:${slug}`), {
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  if (!res.ok) return {};
  const data = await res.json();
  const pageTheme = data?.pageTheme;
  const settings =
    pageTheme && typeof pageTheme === "object" && "settings" in pageTheme
      ? (pageTheme as { settings: unknown }).settings
      : undefined;
  return parsePageTheme(settings, slug);
}

export function useSavedPageTheme(slug: string) {
  const query = useQuery({
    queryKey: ["pageTheme", slug],
    queryFn: () => fetchPageTheme(slug),
    staleTime: 60 * 1000,
  });
  const draft = usePageThemeDraft(slug);
  return {
    data: draft ?? query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
