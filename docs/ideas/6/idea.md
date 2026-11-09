# Idea 6: slice of db read path

## What
A DB-time timestamp read from Supabase and shown on the home page, so a player can see the database is connected.

## Constraints
- Read from the database only.
- Done when a timestamp or other connectivity indicator is on the page.

## Decisions from review
- Add one migration with a `db_now()` SQL function (`stable`, `security invoker`, returns timestamptz, execute granted to anon and authenticated only). Called with `supabase.rpc("db_now")`. No table, so no RLS.
- Show it in a small async Server Component inside `<Suspense>`, made dynamic with `connection()`, so ESPN data stays cached and the timestamp is never an hour stale.
- A DB outage or missing env must not break the kicker tables. Catch errors and show "Database: unreachable" with no error details.
- Success text: "Database: connected, time 2026-11-09 14:03:22 UTC".
- Placement (default approved): small footer line under the tables.
- Keep permanently (default approved): a quiet footer status line.
- Tests: unit test with a mocked client (success and error), plus an e2e check for the "Database:" line.
