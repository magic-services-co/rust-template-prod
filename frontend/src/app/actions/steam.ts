import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";

export type SteamGroupResponse = {
  data?: { joinedSteamGroup?: boolean };
  error?: string;
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function refreshSteamGroup(): Promise<SteamGroupResponse> {
  try {
    const res = await fetch(backendApi("user/refresh-steam-group"), {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: (err as { message?: string }).message || "Failed to refresh" };
    }
    const data = await res.json();
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to refresh Steam group" };
  }
}

export async function refreshSteamGroupForUser(userId: string): Promise<SteamGroupResponse> {
  try {
    const res = await fetch(backendApi(`admin/users/${userId}/refresh-steam-group`), {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: (err as { message?: string }).message || "Failed to refresh" };
    }
    const data = await res.json();
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to refresh Steam group" };
  }
}
