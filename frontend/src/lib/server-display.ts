export function serverRegion(categoryName?: string): { label: string; flag?: string } {
  const name = (categoryName || "").toLowerCase();
  if (/\beu\b|europe/.test(name)) {
    return { label: "EUROPE", flag: "/images/servers/flag-eu.png" };
  }
  if (/\bna\b|north america|united states|\bus\b/.test(name)) {
    return { label: "NORTH AMERICA", flag: "/images/servers/flag-na.png" };
  }
  if (/\bau\b|oceania|australia/.test(name)) {
    return { label: "OCEANIA" };
  }
  const cleaned = (categoryName || "SERVER").replace(/servers?/gi, "").trim();
  return { label: (cleaned || "SERVER").toUpperCase() };
}

export function queuedPlayers(players: number, maxPlayers: number): number {
  if (!maxPlayers || players <= maxPlayers) return 0;
  return players - maxPlayers;
}

export function populationPercent(players: number, maxPlayers: number): number {
  const max = maxPlayers || 1;
  return Math.min(100, (100 * (players || 0)) / max);
}
