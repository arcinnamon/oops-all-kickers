import { aggregateKickers, topKickers } from "./rank";
import { parseKicking, parseScoreboard } from "./espn";
import type { GameKicking, KickersResult, League, ScoreboardGame } from "./types";
import type { Week } from "../week";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/football";
const CONCURRENCY = 8;
const DAY = 86_400_000;

function compact(d: Date): string {
  return d.toISOString().slice(0, 10).replaceAll("-", "");
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("ESPN responded " + res.status);
  return res.json();
}

/** UTC calendar days covering the week, padded a day each side. */
export function scoreboardDays(week: Pick<Week, "start" | "end">): string[] {
  const days: string[] = [];
  const last = compact(new Date(week.end.getTime() + DAY));
  for (let t = week.start.getTime() - DAY; ; t += DAY) {
    const day = compact(new Date(t));
    days.push(day);
    if (day >= last) return days;
  }
}

export async function getTopKickers(league: League, week: Week): Promise<KickersResult> {
  const sport = league === "nfl" ? "nfl" : "college-football";

  // ESPN rejects date ranges ("dates=A-B" returns 400), so ask one day at a time.
  // parseScoreboard's kickoff filter is the authority on which games count.
  let games: ScoreboardGame[];
  try {
    const perDay = await Promise.all(
      scoreboardDays(week).map(async (day) => {
        const params = new URLSearchParams({ dates: day, limit: "300" });
        if (league === "fbs") params.set("groups", "80");
        return parseScoreboard(await getJson(BASE + "/" + sport + "/scoreboard?" + params), week);
      }),
    );
    const byId = new Map(perDay.flat().map((g) => [g.id, g]));
    games = [...byId.values()];
  } catch {
    // A missing day could hide a whole slate, so any failed day means unavailable.
    return { status: "unavailable", rows: [] };
  }
  if (games.length === 0) return { status: "no-games", rows: [] };

  const lines: GameKicking[] = [];
  let next = 0;
  let succeeded = 0;
  async function worker() {
    while (next < games.length) {
      const game = games[next++];
      try {
        const summary = await getJson(
          BASE + "/" + sport + "/summary?event=" + encodeURIComponent(game.id),
        );
        lines.push(...parseKicking(summary));
        succeeded++;
      } catch {
        // Skip a game whose summary failed.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, games.length) }, worker));

  // Every summary failing means an outage, not a week without field goals.
  if (succeeded === 0) return { status: "unavailable", rows: [] };

  return { status: "ok", rows: topKickers(aggregateKickers(lines), 3) };
}
