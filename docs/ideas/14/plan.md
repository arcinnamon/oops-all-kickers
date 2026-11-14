# Plan: available kickers update (issue #14)

## Goal

The home page kicker pool lists only active kickers. A new `active` flag and a refreshed full roster migration keep the persisted list current.

## Out of scope

- Automated roster sync, service-role write path, or admin UI.
- Stats-based activity rules, search, filters, or sorting controls.
- Resolving ESPN terms of use.
- Showing inactive kickers anywhere.

## Data model

Alter `public.kickers` in a new append-only migration:
- Add `active boolean not null default true`.

RLS: unchanged. The existing select-only policy for `anon` and `authenticated` covers the new column. No write policies.

Roster migration (separate, append-only): upsert the current roster on `(league, espn_id)` with `active = true`, and set `active = false` for the two placeholder FBS rows and any seeded kicker no longer on a roster. Never delete rows.

## Pages and routes

- `/` (public): unchanged layout. The pool query now filters `active = true` for rows, count, and the "Roster as of" date. An empty active set shows the existing unavailable message.
- No new routes or Server Actions.

## Tasks

- [x] T1: Migration adding `active boolean not null default true` to `kickers`. Verify: new `tests/unit/kickers-active-migration.test.ts` checks the SQL has `add column`, `active boolean not null default true`, and no policy changes or drops.
- [x] T2: Pool query filters `active = true` on both the page query and the latest `updated_at` query; `PoolRow` is unchanged. Verify: extend `tests/unit/pool-query.test.ts` to assert `eq("active", true)` is applied on both queries and that other behavior is unchanged.
- [x] T3: Roster migration upserting the current NFL and FBS kickers from ESPN rosters (position K/PK) with `active = true`, and deactivating placeholders and kickers no longer listed. If ESPN is unreachable, include what can be gathered and note the gap in the PR. Verify: extend `tests/unit/kickers-seed.test.ts` so the newest roster migration has rows with league, espn_id, name, and team, upserts on conflict, sets `active`, and has no `delete` statement.
- [x] T4: Confirm the pool component shows the unavailable message when the query finds no active rows. Verify: extend `tests/unit/kicker-pool-component.test.tsx` with an unavailable-result case, and `tests/unit/pool-query.test.ts` with an empty-result case.
- [x] T5: Run the full check suite. Verify: `bash .github/scripts/verify.sh` passes.

## Risks

- ESPN may be unreachable or its terms may restrict the pull, leaving a partial roster. Mitigation: ship what is gathered and say so in the PR.
- Migrations run before deploy. The column default keeps the old code working in the gap.
- Manual per-season refresh means the list can go stale mid-season. Accepted for now.
