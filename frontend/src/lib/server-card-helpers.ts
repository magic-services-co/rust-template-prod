import type { ServerData } from "@/hooks/use-server-data";
import { getBackendBaseUrl } from "@/lib/api";

/**
 * Parse `https://rustmaps.com/map/{worldSize}_{mapHash}` (segment may use `_` for `/` in ids).
 *
 * - **mapHash** — stable RustMaps map asset id (hex), e.g. `4ac7a25f40904c83a6bd162a9ef1f46b` (used in `.rgt_map` URL).
 * - **mapGen** — numeric CDN / 3D path prefix (world size in this URL shape; custom maps use another number from HTML).
 */
export function parseRustMapsMapPageUrl(mapPageUrl: string): { mapGen: string; mapHash: string } | null {
  try {
    const u = new URL(mapPageUrl.trim());
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "rustmaps.com") return null;
    const mPath = u.pathname.match(/^\/map\/([^/]+)\/?$/i);
    if (!mPath) return null;
    const segment = decodeURIComponent(mPath[1].replace(/\+/g, " "));
    let mapGen: string;
    let mapHash: string;
    const us = segment.indexOf("_");
    if (us > 0) {
      mapGen = segment.slice(0, us);
      mapHash = segment.slice(us + 1);
    } else {
      const hy = segment.match(/^(\d+)-([0-9a-f]+)$/i);
      if (!hy) return null;
      mapGen = hy[1];
      mapHash = hy[2];
    }
    if (!/^\d+$/.test(mapGen) || !/^[0-9a-f]+$/i.test(mapHash)) return null;
    return { mapGen, mapHash };
  } catch {
    return null;
  }
}

/** CDN thumbnail for a RustMaps map page URL (same asset BattleMetrics usually puts in thumbnailUrl). */
export function rustMapsMapPageToThumbnailUrl(mapPageUrl: string): string | null {
  const ids = parseRustMapsMapPageUrl(mapPageUrl);
  if (!ids) return null;
  return `https://content.rustmaps.com/maps/${ids.mapGen}/${ids.mapHash}/thumbnail.webp`;
}

/** Prefer API thumbnail; if missing, derive from `rust_maps.url` when it is a rustmaps.com/map/… link. */
export function getBattleMetricsRustMapThumbnail(data: ServerData): string | undefined {
  const rm = data.attributes.details?.rust_maps;
  if (!rm) return undefined;
  const t = rm.thumbnailUrl;
  if (typeof t === "string" && t.trim().length > 0) return t.trim();
  const pageUrl = rm.url;
  if (typeof pageUrl === "string" && pageUrl.trim().length > 0) {
    const derived = rustMapsMapPageToThumbnailUrl(pageUrl.trim());
    if (derived) return derived;
  }
  return undefined;
}

/**
 * Parse `content.rustmaps.com/maps/{mapGen}/{mapHash}/…` from a thumbnail (or other CDN) URL.
 * **mapHash** is the map asset id (e.g. `4ac7a25f40904c83a6bd162a9ef1f46b`); **mapGen** is the numeric prefix.
 */
export function parseRustMapsId(thumbnailUrl: string): { mapGen: string; mapHash: string } | null {
  const regex = /^https?:\/\/content\.rustmaps\.com\/maps\/(\d+)\/([A-Fa-f0-9]+)/;
  const match = thumbnailUrl.match(regex);
  if (match) {
    return { mapGen: match[1], mapHash: match[2] };
  }
  const withSubpath = /^https?:\/\/content\.rustmaps\.com\/maps\/(\d+)\/([A-Fa-f0-9]+)\//;
  const m2 = thumbnailUrl.match(withSubpath);
  if (m2) {
    return { mapGen: m2[1], mapHash: m2[2] };
  }
  try {
    const path = new URL(thumbnailUrl).pathname;
    const m = path.match(
      /\/maps\/(\d+)\/([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i,
    );
    if (!m) return null;
    return { mapGen: m[1], mapHash: m[2].replace(/-/g, "") };
  } catch {
    return null;
  }
}

/**
 * Physgun RGT viewer URL. Map file is `https://maps.rustmaps.com/3d/{mapGen}/{mapHash}.rgt_map`
 * where **mapHash** is the RustMaps map id (32 hex, e.g. `4ac7a25f40904c83a6bd162a9ef1f46b`).
 */
export function getRgtIframeUrl(mapGen: string, mapHash: string): string {
  return `https://rgt.physgun.com/?map=https://maps.rustmaps.com/3d/${mapGen}/${mapHash}.rgt_map&fps=100&reflections=0&compass=0`;
}

/** Physgun iframe `src` from a full `https://maps.rustmaps.com/3d/.../*.rgt_map` URL. */
export function getPhysgunRgtIframeUrlFromMapFileUrl(rgtMapFileUrl: string): string {
  const params = new URLSearchParams({
    map: rgtMapFileUrl,
    fps: "100",
    reflections: "0",
    compass: "0",
  });
  return `https://rgt.physgun.com/?${params.toString()}`;
}

/** `rustmaps.com/map/…` page that is not `worldSize_hash` (e.g. UUID-only slug) — needs server HTML resolve. */
export function rustMapsMapPageNeedsHtmlResolution(mapPageUrl: string): boolean {
  const u = mapPageUrl.trim();
  if (!u) return false;
  if (parseRustMapsMapPageUrl(u)) return false;
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "rustmaps.com") return false;
    return /^\/map\//i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function getPhysgunRgtIframeUrlForServer(data: ServerData): string | undefined {
  const thumb = getBattleMetricsRustMapThumbnail(data);
  if (!thumb) return undefined;
  const ids = parseRustMapsId(thumb);
  if (!ids) return undefined;
  return getRgtIframeUrl(ids.mapGen, ids.mapHash);
}

export function getServerConnectAddress(data: ServerData): string {
  if (data.server_address) return data.server_address;
  const { ip, port } = data.attributes;
  if (ip != null && port != null) return `${ip}:${port}`;
  if (ip) return ip;
  return "";
}

export function getServerImageUrl(data: ServerData): string | undefined {
  const raw = data.attributes.details?.rust_headerimage || data.image_path;
  if (!raw || typeof raw !== "string") return undefined;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const base = getBackendBaseUrl();
  if (!base) return undefined;
  const path = raw.startsWith("/") ? raw.slice(1) : raw;
  return `${base.replace(/\/$/, "")}/${path}`;
}

export function getBattleMetricsServerUrl(data: ServerData): string {
  return `https://www.battlemetrics.com/servers/${encodeURIComponent(data.id)}`;
}
