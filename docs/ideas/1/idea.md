# Idea: MVP of kickers-only fantasy football app (issue #1)

## Request

As a player I want a page that tracks NFL and FBS kicker statistics for the last completed
week (Tuesday 12:01 am to Monday 11:59 pm). Larger vision: `previous-spec.md` in this folder.

## Done looks like

- One public page with two tables: NFL kickers and FBS kickers.
- Columns: name, team, FG made, FG attempts, longest distance.
- Each table shows the top 3 kickers by FG made, descending.
- Purpose: prove out the data path with one page.

## Decisions from review

- Window is the last completed Tuesday-Monday week in America/Chicago (handles daylight
  saving). No in-progress note. Dates are shown above the tables.
- Games count by kickoff time inside the window.
- Both leagues come from ESPN's unofficial JSON (scoreboard by date range, then per-game
  summary for kicker stats). No CFBD, no new env vars, no new dependencies.
- Fetch server-side with Next.js revalidate of about 1 hour. No database or migration.
- If one league's fetch fails, that table shows "data unavailable" and the other still renders.
- Aggregation: sum each kicker's FGs across the window's games. Longest is the longest made FG.
  Ties on FG made break by longest, then fewer attempts, then name. Kickers with 0 made are
  left out.
- If the feed returns no games: "No games found for this week."
- Licensing of the feeds stays open for the full product. The page shows no scoring.
- Tests: unit tests for window math (including daylight-saving dates) and for aggregation and
  ranking using fixtures. One e2e test that both table headings and column headers render.
