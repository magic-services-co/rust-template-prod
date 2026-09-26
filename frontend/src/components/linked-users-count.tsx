"use client";

import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export const LINKED_USERS_COUNT_QUERY_KEY = ["linked-users-count"] as const;

async function fetchLinkedUsersCount(): Promise<number> {
  const res = await fetch(backendApi("linked-users-count"), { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Failed to fetch count");
  return data.count ?? 0;
}

export function LinkedUsersCount({ className }: { className?: string }) {
  const { data: count, isPending } = useQuery({
    queryKey: LINKED_USERS_COUNT_QUERY_KEY,
    queryFn: fetchLinkedUsersCount,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const display = count != null ? count.toLocaleString() : isPending ? "…" : "—";

  return (
    <p
      className={cn(
        "flex items-center gap-2 text-[10px] font-medium tracking-[0.25px]",
        className,
      )}
      style={{ color: "#bfccdb" }}
    >
      <img src="/images/link/users.svg" alt="" className="size-[15px] shrink-0" />
      <span>
        Join <span style={{ color: "#edf5ff" }}>{display}</span> other linked users!
      </span>
    </p>
  );
}
