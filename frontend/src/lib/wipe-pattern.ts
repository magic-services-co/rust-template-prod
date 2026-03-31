import {
  type WipeScheduleValue,
  isWipeScheduleValue,
  wipeScheduleLabel,
} from "@/lib/wipe-schedule-presets";

export type WipeLike = {
  started_at?: string | null;
};

export type WipePatternMeta = {
  intervalMs: number;
  confidence: "high" | "medium" | "low";
  source: "leaderboard-wipes" | "battlemetrics" | "default-weekly" | "admin-config";
  sampleSize: number;
  adminLabel?: string;
};

const MS_HOUR = 3600000;
const MS_DAY = 86400000;
const TWICE_WEEK_MS = Math.round((7 / 2) * MS_DAY);

function firstThursdayOfMonth(year: number, month: number): Date {
  const first = new Date(year, month, 1, 12, 0, 0, 0);
  const dow = first.getDay();
  const add = (4 - dow + 7) % 7;
  return new Date(year, month, 1 + add, 12, 0, 0, 0);
}

function upcomingFirstThursdays(count: number, now: Date): Date[] {
  const out: Date[] = [];
  let y = now.getFullYear();
  let m = now.getMonth();
  let cand = firstThursdayOfMonth(y, m);
  if (cand.getTime() <= now.getTime()) {
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
    cand = firstThursdayOfMonth(y, m);
  }
  for (let i = 0; i < count; i++) {
    out.push(new Date(cand));
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
    cand = firstThursdayOfMonth(y, m);
  }
  return out;
}

function intervalMsForPreset(preset: Exclude<WipeScheduleValue, "auto" | "monthly_first_thursday">): number {
  switch (preset) {
    case "daily":
      return MS_DAY;
    case "every_2_days":
      return 2 * MS_DAY;
    case "every_3_days":
      return 3 * MS_DAY;
    case "weekly":
      return 7 * MS_DAY;
    case "twice_weekly":
      return TWICE_WEEK_MS;
    case "twice_monthly":
      return 14 * MS_DAY;
    default:
      return 7 * MS_DAY;
  }
}

function buildFromAdminPreset(
  preset: Exclude<WipeScheduleValue, "auto">,
  options: UpcomingWipesFromPatternOptions,
): UpcomingWipesFromPatternResult {
  const count = options.count ?? 4;
  const now = options.now ?? Date.now();
  const nowDate = new Date(now);
  const label = wipeScheduleLabel(preset);

  const startedAtMs = options.wipeRows
    .map((w) => (w.started_at ? Date.parse(String(w.started_at)) : NaN))
    .filter((n) => Number.isFinite(n));

  if (preset === "monthly_first_thursday") {
    const dates = upcomingFirstThursdays(count, nowDate);
    return {
      dates,
      pattern: {
        intervalMs: 28 * MS_DAY,
        confidence: "high",
        source: "admin-config",
        sampleSize: 0,
        adminLabel: label,
      },
    };
  }

  const intervalMs = intervalMsForPreset(preset);
  const anchorMs = resolveNextWipeAnchorMs({
    startedAtMs,
    intervalMs,
    battlemetricsNext: options.battlemetricsNext,
    now,
  });

  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(new Date(anchorMs + i * intervalMs));
  }

  return {
    dates,
    pattern: {
      intervalMs,
      confidence: "high",
      source: "admin-config",
      sampleSize: 0,
      adminLabel: label,
    },
  };
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDevSample(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const v = mean(values.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function filterIntervals(intervals: number[]): number[] {
  const filtered = intervals.filter((d) => d > MS_DAY * 0.2 && d < MS_DAY * 120);
  return filtered.length >= Math.max(1, Math.floor(intervals.length / 2)) ? filtered : intervals;
}

function snapToCommonWeeks(intervalMs: number): number {
  const weeks = [1, 2, 3, 4];
  for (const w of weeks) {
    const target = w * 7 * MS_DAY;
    if (Math.abs(intervalMs - target) < 6 * MS_HOUR) return target;
  }
  return intervalMs;
}

export function inferIntervalMsFromWipeStarts(startedAtMs: number[]): number | null {
  const sorted = [...startedAtMs].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (sorted.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i]! - sorted[i - 1]!);
  }
  const use = filterIntervals(intervals);
  const med = median(use);
  if (!Number.isFinite(med) || med < MS_DAY * 0.25) return null;
  return snapToCommonWeeks(med);
}

function confidenceFromIntervals(intervals: number[]): "high" | "medium" | "low" {
  if (intervals.length >= 3) {
    const mu = mean(intervals);
    if (mu <= 0) return "low";
    const cv = stdDevSample(intervals) / mu;
    if (cv < 0.12) return "high";
    if (cv < 0.22) return "medium";
    return "low";
  }
  if (intervals.length === 2) return "medium";
  if (intervals.length === 1) return "medium";
  return "low";
}

export function resolveNextWipeAnchorMs(options: {
  startedAtMs: number[];
  intervalMs: number;
  battlemetricsNext?: string;
  now?: number;
}): number {
  const now = options.now ?? Date.now();
  const bmNext = options.battlemetricsNext ? Date.parse(options.battlemetricsNext) : NaN;

  if (options.startedAtMs.length === 0) {
    if (Number.isFinite(bmNext) && bmNext > now) return bmNext;
    return now + options.intervalMs;
  }

  const lastStart = Math.max(...options.startedAtMs);
  let t = lastStart + options.intervalMs;
  while (t < now - MS_HOUR) {
    t += options.intervalMs;
  }

  if (Number.isFinite(bmNext) && bmNext > now && Math.abs(bmNext - t) < 3 * MS_DAY) {
    return bmNext;
  }
  return t;
}

export type UpcomingWipesFromPatternOptions = {
  wipeRows: WipeLike[];
  battlemetricsLast?: string;
  battlemetricsNext?: string;
  count?: number;
  now?: number;
  schedulePreset?: string | null;
};

export type UpcomingWipesFromPatternResult = {
  dates: Date[];
  pattern: WipePatternMeta;
};

export function buildUpcomingWipesFromPattern(
  options: UpcomingWipesFromPatternOptions,
): UpcomingWipesFromPatternResult {
  const rawPreset = options.schedulePreset?.trim() || "auto";
  if (isWipeScheduleValue(rawPreset) && rawPreset !== "auto") {
    return buildFromAdminPreset(rawPreset, options);
  }

  const count = options.count ?? 4;
  const now = options.now ?? Date.now();

  const startedAtMs = options.wipeRows
    .map((w) => (w.started_at ? Date.parse(String(w.started_at)) : NaN))
    .filter((n) => Number.isFinite(n));

  const sortedStarts = [...startedAtMs].sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < sortedStarts.length; i++) {
    intervals.push(sortedStarts[i]! - sortedStarts[i - 1]!);
  }

  let intervalMs = inferIntervalMsFromWipeStarts(startedAtMs);
  let source: WipePatternMeta["source"] = "leaderboard-wipes";
  let confidence: WipePatternMeta["confidence"] = "low";

  if (intervalMs != null && source === "leaderboard-wipes") {
    const iv = filterIntervals(intervals);
    confidence = iv.length > 0 ? confidenceFromIntervals(iv) : "medium";
  }

  if (intervalMs == null) {
    const L = options.battlemetricsLast ? Date.parse(options.battlemetricsLast) : NaN;
    const N = options.battlemetricsNext ? Date.parse(options.battlemetricsNext) : NaN;
    if (Number.isFinite(L) && Number.isFinite(N) && N > L) {
      intervalMs = N - L;
      intervalMs = snapToCommonWeeks(intervalMs);
      source = "battlemetrics";
      confidence = "medium";
    } else {
      intervalMs = 7 * MS_DAY;
      source = "default-weekly";
      confidence = "low";
    }
  }

  const anchorMs = resolveNextWipeAnchorMs({
    startedAtMs,
    intervalMs,
    battlemetricsNext: options.battlemetricsNext,
    now,
  });

  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(new Date(anchorMs + i * intervalMs));
  }

  return {
    dates,
    pattern: {
      intervalMs,
      confidence,
      source,
      sampleSize: startedAtMs.length,
    },
  };
}

export function describeWipePattern(meta: WipePatternMeta): string {
  if (meta.source === "admin-config") {
    return meta.adminLabel
      ? `Admin schedule: ${meta.adminLabel}`
      : "Admin-configured wipe schedule";
  }
  const days = meta.intervalMs / MS_DAY;
  const d = Math.round(days * 10) / 10;
  const src =
    meta.source === "leaderboard-wipes"
      ? `${meta.sampleSize} leaderboard wipe(s)`
      : meta.source === "battlemetrics"
        ? "BattleMetrics last/next"
        : "default weekly cadence";
  return `~${d} day interval (${meta.confidence} confidence, from ${src})`;
}
