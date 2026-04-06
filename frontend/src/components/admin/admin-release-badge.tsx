"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

type ReleasePayload = {
  currentVersion?: string;
  latestVersion?: string;
  isUpToDate?: boolean;
  updateAvailable?: boolean;
  manifestFetchError?: string | null;
};

export function AdminReleaseBadge() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "system", "release"],
    queryFn: async (): Promise<ReleasePayload> => {
      const res = await fetch(backendApi("admin/system/release"), {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error("release");
      }
      return (await res.json()) as ReleasePayload;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const versionLabel = data?.currentVersion ?? "…";
  let dotClass = "bg-muted-foreground";
  let title = "Release status";
  if (isLoading) {
    dotClass = "animate-pulse bg-muted-foreground";
    title = "Loading version…";
  } else if (isError) {
    dotClass = "bg-amber-500";
    title = "Could not load release status";
  } else if (data?.manifestFetchError) {
    dotClass = "bg-amber-500";
    title = `Manifest: ${data.manifestFetchError}`;
  } else if (data?.updateAvailable) {
    dotClass = "bg-red-500";
    title = `Update available: v${data.latestVersion ?? "?"} (you are on v${data.currentVersion ?? "?"})`;
  } else if (data?.isUpToDate) {
    dotClass = "bg-green-500";
    title = `Up to date (v${data.currentVersion ?? "?"})`;
  }

  return (
    <Link
      href="/admin/update"
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
      title={title}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span>{isLoading ? "v…" : `v${versionLabel}`}</span>
    </Link>
  );
}
