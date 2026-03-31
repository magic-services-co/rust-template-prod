function getBackendApiUrl(): string {
  const base =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? ""
      : "";
  return base.replace(/\/$/, "");
}

/**
 * API URL for fetches. In the browser, use same-origin `/api/...` so requests go through
 * `src/app/api/[...path]/route.ts` (forwards to Laravel). That avoids CORS when the frontend
 * host/port is not listed in Laravel `config/cors.php`.
 */
export function backendApi(path: string): string {
  const p = path.startsWith("/") ? path.slice(1) : path;
  if (typeof window !== "undefined") {
    return `/api/${p}`;
  }
  return `${getBackendApiUrl()}/api/${p}`;
}

export function getBackendBaseUrl(): string {
  return getBackendApiUrl();
}

export async function fetchBackend(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = backendApi(path);
  const res = await fetch(url, {
    ...options,
    headers: { Accept: "application/json", ...options?.headers },
  });
  if (typeof window !== "undefined" && res.status === 403) {
    try {
      const body = await res.clone().json();
      if (body?.error === "license_required") {
        window.location.href = "/";
      }
    } catch {
      // ignore
    }
  }
  return res;
}
