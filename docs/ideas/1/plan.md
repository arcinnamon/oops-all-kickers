# Plan: kickers-only MVP, top-3 kicker tables (issue #1)

## Goal

The home page shows two tables, NFL and FBS, each listing the top 3 kickers by field goals made
for the last completed Tuesday-Monday week. It proves we can pull per-kicker stats for both
leagues from ESPN's unofficial JSON on the server.

## Out of scope

- Accounts, contests, lineups, scoring, doinks, or bonuses (see `previous-spec.md`).
- A database, migration, or stored stats. Caching is Next.js fetch revalidate only.
- FCS, other weeks, a week picker, or an in-progress week view.
- New dependencies or env vars.
- Resolving feed licensing (open for the full product).

## Data model

None. No tables, no RLS, no migration.

## Pages and routes

- `/`: public. Replaces the placeholder. Server Component with `revalidate = 3600`. Shows the
  week's dates, then an "NFL kickers" table and an "FBS kickers" table with columns Name, Team,
  FG made, FG attempts, Longest. Per-league states: "data unavailable" on fetch failure,
  "No games found for this week." when there are no games, and an empty-table message if no
  kicker made a FG. Headers render in every state.
- No route handlers or Server Actions. Nothing is mutated, so no auth check applies.

## Tasks

- [x] T1: Add `lib/week.ts` with `lastCompletedWeek(now: Date)` returning the start (Tuesday 00:01) and end (Monday 23:59:59) instants in America/Chicago, plus a display label. Use `Intl` only. If now is inside a window, return the previous one. Verify: `tests/unit/week.test.ts` covers a mid-week date, Tuesday 00:00 vs 00:01, Monday 23:59, and the March and November daylight-saving changes.
- [x] T2: Add `lib/kickers/types.ts` and `lib/kickers/rank.ts`: a `GameKicking` type, `aggregateKickers(games)` that sums FG made and attempts per kicker, takes the longest made FG, drops 0-made kickers, and sorts by made desc, longest desc, attempts asc, name asc, and `topKickers(rows, 3)`. Verify: `tests/unit/rank.test.ts` covers multi-game sums, each tie-break level, 0-made exclusion, the top-3 cut, and empty input.
- [x] T3: Add `lib/kickers/espn.ts` with `parseScoreboard(json, week)` (completed events with id and kickoff, filtered to the window) and `parseKicking(summaryJson)` (per player: name, team, FG made/attempts from the "FG" made/attempts value, and LONG). Parse defensively, returning empty on unexpected shapes. Before writing fixtures, fetch one real NFL and one real FBS payload and shape small fixtures in `tests/fixtures/` from them. Verify: `tests/unit/espn-parse.test.ts` covers a normal game, a game with no kicker, a malformed payload, and a game outside the window.
- [x] T4: Add `lib/kickers/fetch.ts` with `getTopKickers(league: "nfl" | "fbs", week)`. It calls the ESPN scoreboard (`site.api.espn.com/apis/site/v2/sports/football/{nfl|college-football}/scoreboard` with `dates=YYYYMMDD-YYYYMMDD`, a large `limit`, and `groups=80` for FBS), then each completed game's `summary?event=ID` with limited concurrency, all with `next: { revalidate: 3600 }`. Pad the scoreboard dates by a day on each side so edge kickoffs are not missed; T3's kickoff filter is the authority. Return `{ status: "ok" | "no-games" | "unavailable", rows }`. A scoreboard failure gives `unavailable`; a single failed summary is skipped. Verify: `tests/unit/fetch.test.ts` with mocked `fetch` covers ok, no-games, scoreboard failure, and one failed summary.
- [x] T5: Add `components/KickerTable.tsx` (Server Component): a `<table>` with a caption, `<th scope="col">` headers Name, Team, FG made, FG attempts, Longest, and the status messages above. Verify: `tests/unit/kicker-table.test.tsx` renders to static markup with `react-dom/server` and asserts headers, row order, and each status message. If Vitest cannot run `.tsx` without config or dependency changes, move the row and status shaping into a pure function in `lib/kickers/` and test that instead.
- [x] T6: Replace `app/page.tsx` with the kickers page: h1 "Oops All Kickers", the week label, and both tables fetched in parallel with `Promise.all`, plus `export const revalidate = 3600`. Make tables usable at phone width (scrollable wrapper, visible focus) with minimal styles in `app/globals.css`. Verify: `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- [x] T7: Replace `tests/e2e/home.spec.ts` (it tests the old "Hola" greeting, which this feature removes) with a test that loads `/` and asserts the "NFL kickers" and "FBS kickers" headings and the five column headers in each table. It must pass whether the feed returns data or "data unavailable", since server-side fetches can't be intercepted by Playwright. Verify: `npm run test:e2e` passes, and fails if a column header is removed.
- [x] T8: Write `docs/ideas/1/data-notes.md` from the real responses seen in T3: endpoints used, what each gives us (per-game kicker FG made, attempts, long) and doesn't (per-attempt distances, misses by type, doinks), observed load time and rate limits, and the licensing caveat. Verify: `bash .github/scripts/verify.sh` passes, and the file exists with those sections filled in.

## Risks

- ESPN's unofficial JSON may lack a kicker's longest FG, or differ between NFL and FBS (some FBS summaries may omit stats). Mitigation: shape fixtures from real payloads in T3 and record gaps in T8.
- FBS has 60+ games a week, so a cold cache means 60+ summary requests, risking slow loads and rate limits. Mitigation: limited concurrency, 1-hour revalidate, and skipping failed games.
- Unofficial feeds can change without notice or carry usage limits. The page degrades to "data unavailable" per league, and licensing stays open.
