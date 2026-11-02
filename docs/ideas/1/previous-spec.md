# Oops All Kickers — MVP Product Specification

**Version:** 1.1-draft  
**Date:** 2026-11-02  
**Status:** Stage 2 specification; no implementation authorized  
**Repository:** https://github.com/arcinnamon/oops-all-kickers

## 1. Product intent

Build a mobile-first, free-to-play fantasy football website exclusively for kickers. Friends join private weekly salary-cap contests, submit three-kicker lineups, and compete using ordinary kicking statistics plus deliberately chaotic bonuses such as doinks, redemption, and clutch kicks. Results contribute to cumulative season standings.

### MVP scope decision

**MVP: NFL and NCAA Division I FBS kickers in one combined player pool.** Both leagues are first-class MVP requirements. FCS is excluded. A single play-by-play provider supporting both NFL and FBS is preferred, but must pass the Stage 3 feasibility gate; do not assume cross-league completeness or doink detection. If no provider qualifies, escalate the scope/provider tradeoff for product-owner approval rather than silently removing NFL.

## 2. Confirmed product rules

| Area | Requirement |
|---|---|
| Platform | Mobile-friendly web application |
| Player pool | NFL + NCAA Division I FBS; FCS excluded |
| League mixing | NFL and FBS kickers compete in the same lineup and leaderboard |
| Competition | Weekly contests, not drafts or head-to-head leagues |
| Visibility | Private, invitation-only contests |
| Entries | One lineup per user per contest |
| Roster | Exactly three distinct eligible kickers |
| Salary cap | $30,000 per lineup |
| Salary methodology | Simple tiers based on recent performance; final thresholds pending |
| Lineup lock | One fixed deadline selected by contest creator |
| Weekly window | Tuesday through Monday in America/Chicago time |
| Scoring | Standard kicks plus maximum-chaos bonuses; all qualifying bonuses stack |
| Doink | Any verified goalpost contact on a field goal or extra point, made or missed |
| Doink evidence | Explicit trusted-provider identification; supplemental social verification pipeline is proposed, subject to evidence approval rules |
| Redemption | First successful field goal following a missed field goal in the same game, at most once per game |
| Weekly tie-breakers | Highest score; longest successful field goal; most successful field goals; shared rank thereafter |
| Season standings | Cumulative weekly points; missing a contest yields zero |
| Postponed/canceled games | Kicker scores zero if game is not played inside the contest window |
| Finalization | Target 24 hours after the last eligible game ends; extend when required data is delayed |
| Financial model | Free contests; no paid entries or cash prizes in MVP |

## 3. User journeys

1. A user registers or signs in.
2. A creator opens a private contest for an eligible Tuesday–Monday window, selects a deadline, and shares invitations.
3. Invitees see the eligible NFL + FBS kicker pool, fixed published salaries, and contest rules.
4. Each entrant selects exactly three different kickers within the $30,000 cap and submits one lineup.
5. Before the deadline, entrants may revise their lineup. At the deadline all lineups lock server-side.
6. After games begin, the system ingests eligible play-by-play events, calculates provisional scores, and displays weekly rankings and event evidence/status.
7. After the last eligible game, the system reconciles data, resolves permitted corrections, finalizes the contest, and updates season standings.

## 4. Scoring rules

### 4.1 Proposed numeric scoring table (requires final approval)

| Event | Points |
|---|---:|
| Extra point made | +1 |
| Extra point missed | -2 |
| Made FG, 0–39 yards | +3 |
| Made FG, 40–49 yards | +4 |
| Made FG, 50–59 yards | +6 |
| Made FG, 60+ yards | +10 |
| Missed FG, 0–39 yards | -4 |
| Missed FG, 40–49 yards | -2 |
| Missed FG, 50+ yards | -1 |
| Made FG doink | +5 |
| Missed FG doink | +2 |
| Redemption Arc | +6 |
| Ice in the Veins | +8 |
| Walk-Off | +10 |
| Moonshot (made FG 60+ yards) | +5 |
| Perfect Day | +5 |
| Meltdown | -5 |

**Important:** The last explicit doink rule supersedes earlier field-goal-only definitions: goalpost contact on **both field goals and extra points**, made or missed, qualifies. Exact extra-point doink bonus amounts are unresolved; do not silently reuse field-goal amounts without approval.

### 4.2 Bonus definitions

- **Doink:** At least one upright or crossbar contact on a single field-goal or extra-point attempt, whether successful or unsuccessful. Multiple contacts during one attempt count as one doink event. Award only after qualifying evidence is verified under the approved evidence policy. An unreported doink is not assumed absent.
- **Redemption:** The first made FG after at least one earlier missed FG by the same kicker in the same game; once per kicker-game. XP misses do not trigger redemption.
- **Ice in the Veins:** Made FG gives the team the lead in the last 2:00 of regulation or in overtime, and the lead is not subsequently lost. Evaluate after the game.
- **Walk-Off:** Made FG directly ends the game with a victory.
- **Moonshot:** Made FG of at least 60 yards.
- **Perfect Day:** At least three made FGs, zero missed FGs, and zero missed XPs in the same game; once per game.
- **Meltdown:** At least three combined missed FGs and XPs in the same game; once per game.
- **Stacking:** All qualifying bonuses are additive, without a cap. Standard kick points and penalties also apply.

**Example:** A 62-yard made FG with confirmed doink, redemption, clutch, walk-off, and Moonshot is 10 + 5 + 6 + 8 + 10 + 5 = **44 points** for that attempt; earlier missed kicks are scored separately. This example assumes every condition truly qualifies.

### 4.3 Required scoring safeguards

- Normalize provider events into canonical kick attempts with stable identifiers, game ID, kicker ID, attempt type, result, distance where applicable, period, clock, chronological order, and source evidence.
- Deduplicate provider updates and replay events deterministically; every award must have an event ID and scoring-rule version.
- Recalculate provisional scores when verified provider corrections arrive.
- Do not award an unverified bonus speculatively.
- Explicitly define treatment of blocked kicks, null distance, null kicker ID, penalties/no-plays, and corrected outcomes before production.

## 5. Salary pricing

**Confirmed method:** Simple performance-based tiers, not a predictive market model.

**Candidate tiers, not approved:**

| Recent fantasy points per game | Candidate salary |
|---|---:|
| 15.0+ | $12,000 |
| 11.0–14.99 | $10,000 |
| 8.0–10.99 | $8,000 |
| 5.0–7.99 | $6,000 |
| Below 5.0 | $4,000 |

Candidate lookback: four most recently completed eligible games **within the kicker’s own league**, with rules for players having fewer games to be decided. Cross-league tier calibration is required so salary differences do not arise solely from incompatible feed completeness or scoring distributions. Salary calculation must exclude unverifiable data and must not systematically discount kickers because records are missing. Freeze the salary and eligibility snapshot when the contest opens; subsequent data changes do not mutate a published contest's prices. Enforce the $30,000 cap on the server.

## 6. Contest lifecycle and timing

States: **Draft → Open → Locked → Live → Provisional → Finalized**; cancellation/administrative review states may be added.

- The creator chooses one lineup deadline no later than the earliest eligible scheduled kickoff across **both NFL and FBS**; the server must validate this constraint.
- All time comparisons use authoritative server timestamps; the contest window is Tuesday 00:00 through the following Tuesday 00:00, **end-exclusive**, in America/Chicago time. Daylight saving changes must be handled.
- Determine eligibility by kickoff within the contest window for both leagues, subject to the approved rescheduling policy. League-specific byes and season start/end dates do not change the Tuesday–Monday contest boundaries.
- Game postponed beyond the window: zero for affected kicker; no automatic replacement after lock.
- Target finalization: 24 hours after the last eligible game ends, **but defer finalization if required data has not arrived**. Establish an operational maximum delay and escalation policy before launch.
- Finalization and any post-final corrections must be auditable. Whether admins may reopen final results remains undecided.
- A user who skips a weekly contest contributes zero points for that week to the relevant season standings.

## 7. Data-provider feasibility gate (Stage 3 prerequisite)

**No single provider has been validated as sufficient for both NFL and FBS.** Prior CFBD exporter access and unauthenticated ESPN/CFBD collection attempts failed at a proxy, which does not establish vendor denial or absence of data. CFBD remains an FBS historical-data candidate; ESPN JSON may be supplemental. Neither has proven full dual-league coverage or doink detection. Evaluate commercial cross-league providers (e.g., Sportradar or SportsDataIO) with actual sample payloads, licensing terms, and pricing; provider names are candidates, not selections.

Before committing to a provider or building production scoring:

1. Obtain real sample payloads, preferably authenticated, for representative NFL games and FBS games across conferences, including edge cases.
2. Confirm the required fields **separately for NFL and FBS**: complete schedules, kicker identity, made/missed FG and XP events, FG distance, event order, team scores, game clocks, statuses, corrections, and stable event identifiers.
3. Test missing-game rates and completeness **by league**, not just presence of endpoints. Include weeks when only one league has games.
4. Determine whether explicit goalpost contact is recorded for made and missed FGs and XPs.
5. Check freshness, terms of use, commercial/fantasy redistribution rights, cost, rate limits, and historical coverage.
6. Document every coverage gap and choose whether to exclude a game before lineups open.
7. Verify that one commercial agreement permits NFL and FBS use in a free fantasy product; if not, present the cost/complexity of two adapters for explicit approval.

**Social verification research:** Evaluate offtheupright.com / its Bluesky posts and other public posts as candidate leads for doink verification. Social reports are not automatically authoritative. Define approved evidence, attribution, deduplication, manual review permissions, provenance, and appeal/correction rules before awarding bonuses. Do not assume social scraping is permitted or technically stable.

**Cross-league normalization:** Map NFL and FBS feeds into the same canonical game, player, and kick-event model. Provider identifiers must be namespaced by league to avoid collisions. Apply one scoring-rule version to both leagues; do not quietly give NFL and FBS different point values. Compare availability, event semantics, latency, and correction behavior by league.

**MVP eligibility gate:** Only publish games that pass a minimum data-quality check. Define the exact pass/fail thresholds before implementation. Goalpost-contact coverage may be incomplete even when normal kick stats are complete; the product must disclose that limitation or establish a consistent verified workflow.

## 8. Leaderboards

Weekly order:

1. Highest total fantasy score.
2. Longest successful FG across all three kickers' eligible games.
3. Greatest total number of successful FGs across those games.
4. Shared rank if still tied.

Season standings are cumulative weekly points for the same defined group/season. The season tie-breaker and whether private contests share a season-wide group are unresolved.

## 9. Nonfunctional requirements

- Mobile-first responsive interface and accessible forms, status indicators, and leaderboard.
- Authorization on every private-contest and lineup endpoint; invitation links must not leak private data.
- Atomic enforcement of one entry per user per contest, even under concurrent requests.
- Server-side lineup validation and lock checks; client clock is informational only.
- Idempotent ingestion and scoring; retain source evidence and reconciliation history.
- Separate ingestion, normalization, scoring, and presentation responsibilities so providers can change without rewriting game rules.
- Log provider failures and stale feeds; clearly mark provisional and incomplete results.
- No paid contests, gambling, or prize disbursements in MVP.

## 10. Acceptance criteria and test matrix

| ID | Scenario | Expected result |
|---|---|---|
| A01 | Uninvited user accesses contest | Access denied |
| A02 | User submits two entries concurrently | Exactly one accepted |
| A03 | Lineup has 2, 4, or duplicate kickers | Rejected |
| A04 | Salary total $30,001 | Rejected |
| A05 | Salary total $30,000 | Accepted if otherwise valid |
| A06 | Edit at exact lock timestamp | Rejected |
| A07 | Kickoff rescheduled before chosen deadline | Contest flagged for deadline remediation; no unfair late entry |
| A08 | Made FG at 39/40/49/50/59/60 yards | Correct tier boundaries |
| A09 | Missed FG at 39/40/49/50 yards | Correct penalty boundaries |
| A10 | Made 62-yard doink with all qualifying bonuses | 44 points for attempt, plus separate scoring of earlier events |
| A11 | Two goalpost contacts on one attempt | Exactly one doink bonus |
| A12 | Goalpost contact on XP | Recognized as doink; exact bonus awaits approval |
| A13 | Miss, make, make by same kicker | Redemption once |
| A14 | XP miss followed by FG make | No redemption from XP miss |
| A15 | Duplicate play-by-play event received | No duplicate points |
| A16 | Provider revises FG result | Deterministic score and rank recalculation |
| A17 | Postponed game played outside window | Kicker scores zero |
| A18 | Missing required game data | Game excluded before lineup publication; no silent scoring |
| A19 | Tie on points only | Longest made FG wins |
| A20 | Tie on points and longest FG | Most made FGs wins |
| A21 | Tie on all three criteria | Shared rank |
| A22 | User misses a week | Adds zero to cumulative total |
| A23 | Delayed mandatory feed at +24 hours | Finalization deferred and surfaced as pending |
| A24 | Central DST transition | Correct Tuesday–Monday eligibility boundaries |
| A25 | Provider event out of order | Same score after deterministic replay |
| A26 | Blocked/no-play/unknown-distance attempts | Follow explicitly approved attribution rules, not guesses |
| A27 | Lineup contains NFL and FBS kickers | Accepted when all three are eligible and under cap |
| A28 | NFL and FBS provider IDs overlap | Canonical identities remain distinct |
| A29 | NFL bye week or FBS season has ended | Only scheduled eligible games enter the contest pool |
| A30 | NFL and FBS events with identical kick attributes | Identical scoring outcomes under the same rule version |
| A31 | One league feed is delayed or incomplete | Only affected games are flagged; no silent fabrication or premature finalization |
| A32 | Earliest eligible kickoff is an FBS weekday game | Creator-selected lock must precede that kickoff even if NFL games occur later |

Test at multiple levels: pure scoring unit tests with hand-calculated fixtures; contract tests using real provider payloads; integration tests for ingestion and reconciliation; API authorization/concurrency tests; and end-to-end mobile lineup/leaderboard tests. Every required test must pass before production deployment.

## 11. Unresolved decisions — explicit blockers

**Before Stage 3 architecture is finalized:**

1. **Data feasibility:** Proven provider coverage and lawful usage for both NFL and FBS play-by-play, including doink verification.
2. **Doink evidence policy:** Whether trusted-provider-only remains strict, or approved social verification may establish an event; bonus points for made/missed XP doinks.
3. **Scoring approval:** Confirm numeric scoring table, blocked-kick treatment, null-distance behavior, and clutch/walk-off interpretation for unusual game endings.
4. **Salary calibration:** Approve tier thresholds, lookback, first-game/new-kicker pricing, and minimum historical sample size.
5. **Contest operations:** Invitation expiry, membership/season group model, scheduling changes, cancellations, finalization maximum delay, and post-final corrections.

**Nonblocking design choices:** exact UI styling, badges, notification delivery, administrator dashboard detail, and future FCS expansion architecture.

## 12. Stage gates and delivery protocol

- **Intent:** This product purpose and MVP boundary are understood and approved.
- **Specification (current):** Resolve the blockers above and version the scoring rulebook, data contract, and acceptance tests.
- **Plan:** Produce an incremental implementation checklist, architecture decisions, data feasibility findings, and test strategy. Each increment must be small enough for a reviewable PR.
- **Build:** Implement one checklist item per change, with tests and a working demo where appropriate.
- **Test:** Independently verify expected results and failure cases; no self-attested pass without evidence.
- **Harden:** Review authorization, idempotency, data provenance, failure handling, and observability.
- **Deploy:** Release through gated environments with rollback and operational documentation.

**No code changes, commits, or deployments are authorized by this document.**