import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export type Role = {
  id: string;
  name: string;
  order?: number;
  color?: string | null;
  permissions?: { id: string; title?: string; resource?: string; action?: string }[];
  users?: { id: string; name: string | null; image: string | null }[];
  /** When false, current user cannot edit/delete this role or move it above their highest role (Discord-style hierarchy). */
  canManage?: boolean;
  [key: string]: unknown;
};

export async function getRoles(): Promise<Role[]> {
  const res = await fetch(backendApi("admin/settings/roles"), {
    headers: authHeaders(),
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch roles");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function addUserToRole({
  roleId,
  userId,
}: {
  roleId: string;
  userId: string;
}): Promise<void> {
  const res = await fetch(backendApi(`admin/roles/${roleId}/users`), {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    let msg = (err?.error ?? err?.message) as string | undefined;
    if (!msg && err?.errors && typeof err.errors === "object") {
      const userIdErr = (err.errors as Record<string, unknown>).userId;
      msg = Array.isArray(userIdErr) ? String(userIdErr[0]) : userIdErr ? String(userIdErr) : undefined;
    }
    throw new Error(msg ?? "Failed to add user to role");
  }
}

export async function removeUserFromRole({
  roleId,
  userId,
}: {
  roleId: string;
  userId: string;
}): Promise<void> {
  const res = await fetch(
    backendApi(`admin/roles/${roleId}/users/${encodeURIComponent(userId)}`),
    {
      method: "DELETE",
      headers: authHeaders(),
      credentials: "include",
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const msg = (err?.error ?? err?.message) as string | undefined;
    throw new Error(msg ?? "Failed to remove user from role");
  }
}
