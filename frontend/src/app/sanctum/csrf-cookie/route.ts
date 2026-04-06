import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const base = BACKEND_URL.replace(/\/$/, "");
  const url = `${base}/sanctum/csrf-cookie`;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("Cookie", cookie);
  const host = request.headers.get("host") || request.nextUrl.host;
  if (host) headers.set("X-Forwarded-Host", host);
  const proto = request.nextUrl.protocol.replace(":", "");
  if (proto) headers.set("X-Forwarded-Proto", proto);
  const referer = request.headers.get("referer");
  if (referer) headers.set("Referer", referer);
  const origin = request.headers.get("origin");
  if (origin) headers.set("Origin", origin);
  headers.set("Accept", request.headers.get("accept") || "application/json");

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers, redirect: "manual" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach Laravel";
    return NextResponse.json({ message: `${message} (${base})` }, { status: 502 });
  }

  const out = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
  });
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "content-encoding" || lower === "transfer-encoding" || lower === "connection") return;
    out.headers.append(key, value);
  });
  return out;
}
