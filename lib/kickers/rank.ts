import type { GameKicking, KickerRow } from "./types";

export function aggregateKickers(games: GameKicking[]): KickerRow[] {
  const byKicker = new Map<string, KickerRow>();
  for (const g of games) {
    const key = `${g.name}|${g.team}`;
    const prev = byKicker.get(key);
    if (prev) {
      prev.made += g.made;
      prev.attempts += g.attempts;
      prev.longest = Math.max(prev.longest, g.longest);
    } else {
      byKicker.set(key, { ...g });
    }
  }
  return [...byKicker.values()]
    .filter((r) => r.made > 0)
    .sort(
      (a, b) =>
        b.made - a.made ||
        b.longest - a.longest ||
        a.attempts - b.attempts ||
        a.name.localeCompare(b.name),
    );
}

export function topKickers(rows: KickerRow[], n: number): KickerRow[] {
  return rows.slice(0, n);
}
