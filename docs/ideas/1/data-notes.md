# Data notes: ESPN kicker stats (issue #1)

**Caveat: the build sandbox could not reach ESPN.** Fixtures in `tests/fixtures/` were shaped from ESPN's
documented payload format, not captured from live responses. Check the parser against a live response
on staging before trusting it.

## Endpoints used

- Scoreboard: `https://site.api.espn.com/apis/site/v2/sports/football/{nfl|college-football}/scoreboard?dates=YYYYMMDD-YYYYMMDD&limit=300` (FBS adds `groups=80`).
- Game summary: `.../summary?event=ID`, read from `boxscore.players[].statistics[]` where `name` is `kicking`.
- Season kicking leaderboard (kicker pool): `https://site.web.api.espn.com/apis/common/v3/sports/football/{nfl|college-football}/statistics/byathlete?seasontype=2&limit=50&page=N`. Read on page load and cached for an hour; nothing is stored. NFL uses `isqualified=false` sorted by attempts (the qualified list drops real starters). FBS uses `isqualified=true`, about 3 pages. The list returns FBS kicking stats blank, so the pool shows names and teams only.

## What we get

- Per game and per kicker: FG as "made/attempts", and LONG (longest FG), found by label.
- Event id, kickoff time, and a completed flag from the scoreboard.

## What we don't get

- Per-attempt distances, miss types, or doinks. Only totals and the longest make.

## Load time and rate limits

Not measured (no network in the build sandbox). Expect about 16 NFL summary requests and 60+ FBS requests on a cold cache, with 8 in flight at once and a 1-hour revalidate. Record the real numbers after the first staging load.

## Licensing

ESPN's JSON is unofficial and undocumented. Terms of use are unresolved and must be settled before a full product.
