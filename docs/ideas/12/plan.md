# Plan: kicker pool (issue #12)

## Goal

Add a paginated "Kicker pool" table (league, name, team) above the scoring tables on the home page. It reads from a new Supabase `kickers` table seeded with the full NFL and FBS kicker roster.

## Out of scope

- Automated roster sync, a service-role write path, or admin UI.
- Search, filters, sorting controls, scores or stats in the pool table.
- Roster building or any per-user data.
- Resolving ESPN terms of use.

## Data model

New table `public.kickers`:
- `id` bigint identity primary key
- `league` text not null, check in ('nfl', 'fbs')
- `espn_id` text not null; unique together with `league`
- `name` text not null
- `team` text not null
- `updated_at` timestamptz not null default now()
- Index on (league, team, name) for the sort order.

RLS: enabled in the same migration. One policy: `select` for `anon` and `authenticated`, using `true`. No insert, update, or delete policies, so only the migration role can write.

Seed: a separate append-only migration of INSERTs (`on conflict (league, espn_id) do update`) built from ESPN team rosters, position K/PK.

## Pages and routes

- `/` (public): renders `KickerPool` inside `<Suspense>` above the NFL and FBS scoring tables. Reads `?page=` (Next 16 async `searchParams`), 25 rows per page. The scoring tables stay cached; only the pool component is dynamic (calls `connection()` like `DbStatus`).
- No new routes or Server Actions. Read-only.

## Tasks

- [ ] T1: Migration `supabase/migrations/<ts>_kickers.sql` creating `kickers`, unique key, index, RLS enabled, and the select-only policy. Verify: `tests/unit/kickers-migration.test.ts` reads the SQL and checks `enable row level security`, one select policy, and no insert/update/delete policy.
- [ ] T2: `lib/kickers/pool.ts` with `parsePage(raw)` (positive integer, default 1, junk or <1 gives 1) and `PAGE_SIZE = 25`. Verify: `tests/unit/pool-page.test.ts` covers undefined, "abc", "0", "-2", "2.5", array values, and "3".
- [ ] T3: `getKickerPool(page)` in `lib/kickers/pool.ts` using `await createClient()`: `select(..., { count: "exact" })` ordered by league, team, name with `range()`; clamps page to the last page; also returns the latest `updated_at`; returns `{ status: "unavailable" }` on error, thrown error, or zero rows. Verify: `tests/unit/pool-query.test.ts` with a mocked client: ordering, range bounds, clamping, error, and empty cases.
- [ ] T4: `components/KickerPool.tsx`, an async Server Component: `<section>` with h2 "Kicker pool", `<table>` with caption and columns League, Name, Team, a "Roster as of YYYY-MM-DD" note, and a `<nav aria-label="Kicker pool pages">` with Previous/Next `<Link href="/?page=n">` (omitted at the ends) and "Page X of Y" text. Shows "Kicker list unavailable, try again later" when unavailable. No `"use client"`. Verify: `tests/unit/kicker-pool-component.test.tsx` checks rows, headers, links on first, middle, and last pages, and the unavailable message.
- [ ] T5: Wire into `app/page.tsx`: accept `searchParams`, render `<Suspense fallback>` with `KickerPool` above the NFL table, keep `revalidate = 3600`. Add minimal styles in `app/globals.css` matching the existing tables, with visible focus on the links and no horizontal overflow at phone width. Verify: `tests/unit/home-page.test.tsx` confirms the pool renders before the scoring tables.
- [ ] T6: Seed migration `supabase/migrations/<ts>_seed_kickers.sql` with the NFL and FBS kicker roster pulled once from ESPN rosters. If ESPN is unreachable from the build environment, ship a clearly marked small placeholder set and say so in the PR. Verify: `tests/unit/kickers-seed.test.ts` checks every INSERT has league, espn_id, name, and team, league values are valid, and it uses `on conflict`.
- [ ] T7: E2E: pool heading and columns appear above the scoring tables; the Next link goes to `/?page=2`; `?page=999` and `?page=abc` don't crash. Verify: add to `tests/e2e/home.spec.ts`, tolerating the unavailable state when no database is configured, as the DbStatus test does.
- [ ] T8: Run `bash .github/scripts/verify.sh` and fix any lint, type, or build failures. Verify: the script passes.

## Risks

- Seed data may be wrong or stale (trades, cuts) and may not be checkable live; the "Roster as of" date shows its age.
- ESPN terms of use are unresolved, and the roster endpoints are unofficial and unverified from the sandbox.
- The dynamic pool component makes `/` partially dynamic; if Suspense does not keep the scoring tables cached, page cost rises.
