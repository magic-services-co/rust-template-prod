/**
 * Laravel Sanctum SPA CSRF: after /sanctum/csrf-cookie, send the XSRF-TOKEN cookie value on X-XSRF-TOKEN
 * (Laravel decrypts and validates; default encrypted cookie — do not use X-CSRF-TOKEN with that).
 * @see https://laravel.com/docs/sanctum#spa-authentication
 */

export function csrfHeaderInit(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/i);
  if (!m?.[1]) return {};
  try {
    return { "X-XSRF-TOKEN": decodeURIComponent(m[1]) };
  } catch {
    return { "X-XSRF-TOKEN": m[1] };
  }
}

export async function fetchSanctumCsrfCookie(): Promise<void> {
  await fetch("/sanctum/csrf-cookie", {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}
