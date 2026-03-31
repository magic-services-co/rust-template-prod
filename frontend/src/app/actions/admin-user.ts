import { cookies } from "next/headers";
import { backendApi } from "@/lib/api";

const AUTH_COOKIE_NAME = "auth_token";

export type UserWithRoles = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  storeId: string | null;
  steamId: string | null;
  discordId: string | null;
  roles: Array<{
    userId: string;
    roleId: string;
    role: { id: string; name: string; color?: string | null; order?: number };
  }>;
  joinedSteamGroup: boolean;
  isBanned: boolean;
  banReason: string | null;
  isBoosting: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
};

export async function getUser(
  userId: string
): Promise<{ data?: UserWithRoles; error?: string; status?: number }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(backendApi(`admin/users/${encodeURIComponent(userId)}`), {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = (body?.error ?? res.statusText) as string;
      return { error: message, status: res.status };
    }

    const data = (await res.json()) as UserWithRoles;
    return { data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch user";
    return { error: message, status: 500 };
  }
}
