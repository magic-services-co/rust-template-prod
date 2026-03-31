"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bomb,
  Crown,
  Dices,
  Flag,
  LayoutGrid,
  Leaf,
  PawPrint,
  Pickaxe,
  Swords,
} from "lucide-react";

const TAB_ICONS: Record<string, LucideIcon> = {
  pvp_stats: Swords,
  resources_stats: Pickaxe,
  explosives_stats: Bomb,
  farming_stats: Leaf,
  misc_stats: Crown,
  events_stats: Flag,
  pve_stats: PawPrint,
  gambling_stats: Dices,
};

export function LeaderboardTabIcon({
  tabKey,
  className,
}: {
  tabKey: string;
  className?: string;
}) {
  const Icon = TAB_ICONS[tabKey] ?? LayoutGrid;
  return <Icon className={className} aria-hidden />;
}
