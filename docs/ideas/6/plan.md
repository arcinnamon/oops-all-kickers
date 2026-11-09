# Plan: idea 6, DB status line

## Goal
Show a live database-time line in the home page footer, read through a new `db_now()` Supabase function. A database failure shows "Database: unreachable" and never breaks the kicker tables.

## Out of scope
- Any table, write path, or auth UI.
- Health endpoints, retries, or showing error details.
- Changing ESPN caching or `revalidate` on the page.

## Data model
No tables. One additive migration creates function `public.db_now()`: returns `timestamptz` (`now()`), `language sql`, `stable`, `security invoker`. Execute is revoked from `public` and granted to `anon` and `authenticated`. It reads no data, so no RLS applies. Backward-compatible (purely additive).

## Pages and routes
- `/` (public): unchanged, plus a footer line from `<DbStatus />` in `<Suspense>`. Fallback text "Database: checking".
- No new routes.

## Tasks
- [x] T1: Add `supabase/migrations/<timestamp>_db_now.sql` with `db_now()` and grants as described. Verify: a unit test in `tests/unit/` reads the migration file and asserts it has `stable`, `security invoker`, a revoke from public, and grants to anon and authenticated only.
- [x] T2: Add `lib/db-status.ts` with `getDbStatus()` that does `await createClient()` then `supabase.rpc("db_now")`, validates the value is a parseable date, and returns `{status:"ok", time}` or `{status:"unreachable"}` (catching thrown errors, missing env, and rpc `error`). Add `formatDbTime()` giving `YYYY-MM-DD HH:mm:ss UTC`. Verify: `tests/unit/db-status.test.ts` mocks `@/lib/supabase/server` for success, rpc error, thrown error, and invalid value; also checks the format.
- [x] T3: Add `components/DbStatus.tsx`, an async Server Component that calls `connection()` from `next/server`, then renders `<footer><p>` with "Database: connected, time ..." or "Database: unreachable". Verify: `tests/unit/db-status-component.test.tsx` mocks `getDbStatus`, awaits the component, renders to static markup, and checks both texts and that no error detail appears.
- [x] T4: Render `<Suspense fallback="Database: checking"><DbStatus /></Suspense>` below the tables in `app/page.tsx`, and add minimal footer styling in `app/globals.css` (readable contrast, wraps at phone widths). Verify: `tests/e2e/home.spec.ts` new test expects text matching `/Database: (connected, time|unreachable)/` and the kicker tables still visible.
- [x] T5: Run `bash .github/scripts/verify.sh` and fix any lint, type, or build failures. Verify: the script reports all checks passing.

## Risks
- Reading cookies in `createClient()` or calling `connection()` may make the whole `/` route dynamic, dropping the page-level cache. Check that the ESPN fetches have their own `next.revalidate` caching, and add it if missing.
- E2E and CI may run without Supabase env, so the e2e test accepts "unreachable" as well as "connected".
- If the migration is not applied before deploy, the page shows "unreachable" until it is. It is harmless because it is caught.
