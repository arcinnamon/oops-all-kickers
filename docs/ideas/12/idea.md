# Idea: kicker pool (issue #12)

As a player I want a list of kickers to choose from so that I can build an informed roster.

## Approved scope

- A paginated "Kicker pool" table with columns league, name, team, above the scoring tables on the home page.
- Backed by a `kickers` table in Supabase holding the full roster (NFL and FBS), so kickers who did not play last week still appear.
- Just a paginated grid. No search, filters, or sorting controls.

## Decisions from the review

- Data is a snapshot seeded by a migration of INSERTs from ESPN team rosters (position K/PK). No sync job, no secrets. Refresh each season with a new append-only migration. Automation is a later idea.
- RLS on, public `select` policy only; no write policies.
- Sort order: league, team, name (alphabetical).
- 25 rows per page, `?page=` param, validated positive integer, clamped to the last page.
- Plain `<Link>` pagination, no client JS.
- The table renders in its own async component inside `<Suspense>` so the scoring tables stay cached (revalidate 3600).
- Show "Roster as of <date>" from the latest `updated_at`.
- DB down or empty table: show "Kicker list unavailable, try again later"; the rest of the page still renders.
- ESPN terms of use are unresolved (docs/ideas/1/data-notes.md); the one-time pull is the owner's call.

## Done looks like

Given I am a player, when I load the page, then I see a table of kickers above the scoring tables.
