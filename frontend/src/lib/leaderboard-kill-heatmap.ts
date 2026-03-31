/**
 * Kill heatmap: grid coordinates from plugin JSON (killInfo / kill_stats).
 * Supports PascalCase and camelCase keys.
 */

export const KILL_HEATMAP_GRID_MAX = 50;

export type KillHeatmapPoint = {
  x: number;
  y: number;
  type: string;
  weaponUsed: string | null;
};

export type KillInfoJson = {
  GridLocation?: { x?: number; y?: number };
  gridLocation?: { x?: number; y?: number };
  WeaponUsed?: string | null;
  weaponUsed?: string | null;
  Type?: string;
  type?: string;
};

function killType(entry: KillInfoJson): string {
  const t = entry.Type ?? entry.type ?? "Player";
  return typeof t === "string" ? t : "Player";
}

/** Normalize API / fake row payload to heatmap points. */
export function parseKillStatsPayload(raw: unknown): KillHeatmapPoint[] {
  if (raw == null) return [];
  let arr: unknown[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw) as unknown;
      arr = Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  const out: KillHeatmapPoint[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const e = item as KillInfoJson;
    const gl = e.GridLocation ?? e.gridLocation;
    if (!gl || typeof gl !== "object") continue;
    const x = typeof gl.x === "number" ? gl.x : Number(gl.x);
    const y = typeof gl.y === "number" ? gl.y : Number(gl.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const w = e.WeaponUsed ?? e.weaponUsed;
    out.push({
      x,
      y,
      type: killType(e),
      weaponUsed: typeof w === "string" ? w : w == null ? null : String(w),
    });
  }
  return out;
}

export type HeatmapLayerId = "kills" | "npc_kills" | string;

/** PvP player kills vs NPC / PvE-style kills from the same kill_stats array. */
export function filterKillPointsForLayer(
  points: KillHeatmapPoint[],
  layerId: HeatmapLayerId,
): KillHeatmapPoint[] {
  if (layerId === "kills") {
    return points.filter((p) => p.type.toLowerCase() === "player");
  }
  if (layerId === "npc_kills") {
    return points.filter((p) => p.type.toLowerCase() === "npc");
  }
  return [];
}

/** Map grid coordinate to pixel along one axis (0–50 grid or 0–1 normalized). */
export function gridToPixel(gridValue: number, span: number): number {
  const v = Number.isFinite(gridValue) ? gridValue : 0;
  if (v >= 0 && v <= 1.0001) return v * span;
  const clamped = Math.min(KILL_HEATMAP_GRID_MAX, Math.max(0, v));
  return (clamped / KILL_HEATMAP_GRID_MAX) * span;
}
