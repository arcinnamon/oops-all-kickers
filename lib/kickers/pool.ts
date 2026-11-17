import { parseLeaderboard } from "./espn";
import { getJson } from "./fetch";
import type { League } from "./types";

export const PAGE_SIZE = 25;

const LIST = "https://site.web.api.espn.com/apis/common/v3/sports/football/";
// ESPN's qualified NFL list drops real starters, so NFL takes every kicker with an
// attempt, sorted so they come first. FBS's unqualified list has blank kicking
// stats, so FBS stays on the qualified list.
const QUERY: Record<League, string> = {
  nfl: "isqualified=false&sort=kicking.fieldGoalAttempts%3Adesc",
  fbs: "isqualified=true&sort=kicking.fieldGoalsMade%3Adesc",
};

export type PoolRow = { espnId: string; league: League; name: string; team: string };
export type PoolResult =
  | { status: "ok"; rows: PoolRow[]; page: number; totalPages: number }
  | { status: "unavailable" };

/** Positive integer from a `?page=` value; anything else gives 1. */
export function parsePage(raw: string | string[] | undefined): number {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return 1;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}

async function leagueKickers(league: League): Promise<PoolRow[]> {
  const sport = league === "nfl" ? "nfl" : "college-football";
  const rows: PoolRow[] = [];
  for (let page = 1, pages = 1; page <= pages; page++) {
    const list = parseLeaderboard(
      await getJson(
        `${LIST}${sport}/statistics/byathlete?seasontype=2&limit=50&page=${page}&${QUERY[league]}`,
      ),
      league === "nfl",
    );
    pages = list.pages;
    rows.push(...list.kickers.map((k) => ({ ...k, league })));
    // Sorted by attempts, so a zero-attempt row means the rest are zero too.
    if (list.sawZeroAttempts) break;
  }
  return rows;
}

export async function getKickerPool(page: number): Promise<PoolResult> {
  try {
    const all = (await Promise.all([leagueKickers("fbs"), leagueKickers("nfl")])).flat();
    if (all.length === 0) return { status: "unavailable" };
    all.sort(
      (a, b) =>
        a.league.localeCompare(b.league) ||
        a.team.localeCompare(b.team) ||
        a.name.localeCompare(b.name),
    );
    const totalPages = Math.ceil(all.length / PAGE_SIZE);
    const current = Math.min(Math.max(1, page), totalPages);
    const rows = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    return { status: "ok", rows, page: current, totalPages };
  } catch {
    return { status: "unavailable" };
  }
}
