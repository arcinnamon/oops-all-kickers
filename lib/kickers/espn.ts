import type { GameKicking, ScoreboardGame } from "./types";
import type { Week } from "../week";

type Json = Record<string, unknown>;

function isObj(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Completed events whose kickoff falls inside the week. */
export function parseScoreboard(
  json: unknown,
  week: Pick<Week, "start" | "end">,
): ScoreboardGame[] {
  if (!isObj(json)) return [];
  const games: ScoreboardGame[] = [];
  for (const ev of arr(json.events)) {
    if (!isObj(ev)) continue;
    const id = typeof ev.id === "string" ? ev.id : typeof ev.id === "number" ? String(ev.id) : null;
    const date = typeof ev.date === "string" ? new Date(ev.date) : null;
    if (!id || !date || Number.isNaN(date.getTime())) continue;
    const status = isObj(ev.status) && isObj(ev.status.type) ? ev.status.type : null;
    if (!status || status.completed !== true) continue;
    if (date < week.start || date > week.end) continue;
    games.push({ id, kickoff: date });
  }
  return games;
}

/** Per-kicker FG lines from a game summary. */
export function parseKicking(summary: unknown): GameKicking[] {
  if (!isObj(summary) || !isObj(summary.boxscore)) return [];
  const out: GameKicking[] = [];
  for (const side of arr(summary.boxscore.players)) {
    if (!isObj(side)) continue;
    const team = isObj(side.team)
      ? String(side.team.abbreviation ?? side.team.displayName ?? "")
      : "";
    for (const group of arr(side.statistics)) {
      if (!isObj(group) || group.name !== "kicking") continue;
      const labels = arr(group.labels).map(String);
      const fgIdx = labels.indexOf("FG");
      const longIdx = labels.indexOf("LONG");
      if (fgIdx < 0) continue;
      for (const a of arr(group.athletes)) {
        if (!isObj(a) || !isObj(a.athlete)) continue;
        const name = a.athlete.displayName;
        const stats = arr(a.stats).map(String);
        const m = /^(\d+)\s*\/\s*(\d+)$/.exec(stats[fgIdx] ?? "");
        if (typeof name !== "string" || !m) continue;
        const longest = longIdx >= 0 ? Number(stats[longIdx]) : 0;
        out.push({
          name,
          team,
          made: Number(m[1]),
          attempts: Number(m[2]),
          longest: Number.isFinite(longest) ? longest : 0,
        });
      }
    }
  }
  return out;
}
