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

export async function getTopKickers(league: League, week: Week): Promise<KickersResult> {
  // Pad a day each side; parseScoreboard's kickoff filter is the authority.
  const from = compact(new Date(week.start.getTime() - DAY));
  const to = compact(new Date(week.end.getTime() + DAY));
  const sport = league === "nfl" ? "nfl" : "college-football";
  const params = new URLSearchParams({ dates: from + "-" + to, limit: "300" });
  if (league === "fbs") params.set("groups", "80");

  let games: ScoreboardGame[];
  try {
    games = parseScoreboard(await getJson(BASE + "/" + sport + "/scoreboard?" + params), week);
  } catch {
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
