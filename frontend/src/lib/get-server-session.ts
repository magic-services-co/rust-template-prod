import { cookies } from "next/headers";
import { backendApi } from "@/lib/api";

const AUTH_COOKIE_NAME = "auth_token";

export type Session = { user?: Record<string, unknown> } | null;

export async function getServerSession(): Promise<Session> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(backendApi("auth/session"), {
      headers,
      cache: "no-store",
    });
    const json = await res.json();
    return json?.user ? { user: json.user } : null;
  } catch {
    return null;
  }
}
