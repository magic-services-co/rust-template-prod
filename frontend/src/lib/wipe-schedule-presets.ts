export const WIPE_SCHEDULE_VALUES = [
  "auto",
  "daily",
  "every_2_days",
  "every_3_days",
  "weekly",
  "twice_weekly",
  "twice_monthly",
  "monthly_first_thursday",
] as const;

export type WipeScheduleValue = (typeof WIPE_SCHEDULE_VALUES)[number];

export const WIPE_SCHEDULE_OPTIONS: { value: WipeScheduleValue; label: string }[] = [
  { value: "auto", label: "Automatic (leaderboard + BattleMetrics)" },
  { value: "daily", label: "Every day" },
  { value: "every_2_days", label: "Every 2 days" },
  { value: "every_3_days", label: "Every 3 days" },
  { value: "weekly", label: "Weekly" },
  { value: "twice_weekly", label: "Twice per week (~3.5 days)" },
  { value: "twice_monthly", label: "Twice per month (~14 days)" },
  { value: "monthly_first_thursday", label: "Monthly — first Thursday" },
];

export function isWipeScheduleValue(v: string | null | undefined): v is WipeScheduleValue {
  return v != null && (WIPE_SCHEDULE_VALUES as readonly string[]).includes(v);
}

export function wipeScheduleLabel(value: string | null | undefined): string {
  if (!value) return WIPE_SCHEDULE_OPTIONS[0]!.label;
  const o = WIPE_SCHEDULE_OPTIONS.find((x) => x.value === value);
  return o?.label ?? value;
}
