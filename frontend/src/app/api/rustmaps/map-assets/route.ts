import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

/**
 * Fetches a RustMaps map HTML page and extracts CDN paths so clients can build
 * thumbnail + `.rgt_map` URLs for UUID-style `/map/{id}` pages (internal map gen id is only in HTML).
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let mapUrl: URL;
  try {
    mapUrl = new URL(raw.trim());
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (mapUrl.protocol !== "https:" && mapUrl.protocol !== "http:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  const host = mapUrl.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "rustmaps.com") {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }
  if (!/^\/map\//i.test(mapUrl.pathname)) {
    return NextResponse.json({ error: "Not a map page" }, { status: 400 });
  }

  try {
    const res = await fetch(mapUrl.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; RustTemplate/1.0)",
      },
      redirect: "follow",
      next: { revalidate },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "RustMaps fetch failed" }, { status: 502 });
    }
    const html = await res.text();
    const m = html.match(/https:\/\/content\.rustmaps\.com\/maps\/(\d+)\/([a-f0-9]{32})\//i);
    if (!m) {
      return NextResponse.json({ error: "Could not locate map assets in page" }, { status: 422 });
    }
    const mapGen = m[1];
    const mapHash = m[2].toLowerCase();
    const thumbnailUrl = `https://content.rustmaps.com/maps/${mapGen}/${mapHash}/thumbnail.webp`;
    const rgtMapUrl = `https://maps.rustmaps.com/3d/${mapGen}/${mapHash}.rgt_map`;
    return NextResponse.json({ mapGen, mapHash, thumbnailUrl, rgtMapUrl });
  } catch {
    return NextResponse.json({ error: "Resolution failed" }, { status: 502 });
  }
}
