# Idea: available kickers update (issue #14)

As a player I want the available kickers list updated and persisted so I can pick in an informed way.

Done looks like: when a player loads the page, the available kickers table lists active kickers.

## Decisions from review

- #12 already persists the pool in `public.kickers`. Missing: an "active" notion and a current roster.
- Add `active boolean not null default true` via a new append-only migration. The pool query shows only `active = true`.
- "Active" means on a current team roster, via the flag. No stats-based rule.
- Replace the placeholder seed (5 NFL kickers, 2 placeholder FBS rows) with a full current roster in a new migration. Placeholders are set inactive. If ESPN is unreachable, ship what we can and say so in the PR.
- "Updated" means a manual per-season refresh by migration: new kickers upserted, cut or retired kickers set `active = false`. Automated sync is a separate later idea.
- ESPN terms of use remain unresolved (docs/ideas/1/data-notes.md). The one-time pull is the owner's call, as in #12.
- The column has a default so the deployed code keeps working while migrations run first. App change ships in the same PR.
