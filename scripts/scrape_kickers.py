#!/usr/bin/env python3
"""Load season kicking stats for NFL and FBS kickers into the kickers table.

Reads the JSON feed behind ESPN's kicking stats pages (the pages themselves
sit behind a bot challenge) and upserts one row per kicker.

    SUPABASE_URL=... SUPABASE_SECRET_KEY=... python3 scripts/scrape_kickers.py
    python3 scripts/scrape_kickers.py --dry-run   # print rows, write nothing

Standard library only. The secret key bypasses row-level security: keep it
out of the app and out of git.
"""

import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

LEAGUES = {"nfl": "nfl", "fbs": "college-football"}
LIST_URL = (
    "https://site.web.api.espn.com/apis/common/v3/sports/football/{sport}"
    "/statistics/byathlete?isqualified=true&sort=kicking.fieldGoalsMade%3Adesc"
    "&limit=50&page={page}"
)
STATS_URL = (
    "https://sports.core.api.espn.com/v2/sports/football/leagues/{sport}"
    "/seasons/{season}/types/2/athletes/{id}/statistics"
)
# Table column -> (ESPN category, ESPN stat name)
COLUMNS = {
    "games_played": ("general", "gamesPlayed"),
    "fg_made": ("kicking", "fieldGoalsMade"),
    "fg_attempts": ("kicking", "fieldGoalAttempts"),
    "longest": ("kicking", "longFieldGoalMade"),
    "fg_made_1_19": ("kicking", "fieldGoalsMade1_19"),
    "fg_made_20_29": ("kicking", "fieldGoalsMade20_29"),
    "fg_made_30_39": ("kicking", "fieldGoalsMade30_39"),
    "fg_made_40_49": ("kicking", "fieldGoalsMade40_49"),
    "fg_made_50_plus": ("kicking", "fieldGoalsMade50"),
    "fg_attempts_1_19": ("kicking", "fieldGoalAttempts1_19"),
    "fg_attempts_20_29": ("kicking", "fieldGoalAttempts20_29"),
    "fg_attempts_30_39": ("kicking", "fieldGoalAttempts30_39"),
    "fg_attempts_40_49": ("kicking", "fieldGoalAttempts40_49"),
    "fg_attempts_50_plus": ("kicking", "fieldGoalAttempts50"),
    "xp_made": ("kicking", "extraPointsMade"),
    "xp_attempts": ("kicking", "extraPointAttempts"),
}


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "kicker-stats-loader"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def parse_list(page):
    """Kickers on one page of the leaderboard: ESPN id, name, team."""
    return [
        {
            "espn_id": a["athlete"]["id"],
            "name": a["athlete"]["displayName"],
            "team": a["athlete"].get("teamShortName", ""),
        }
        for a in page["athletes"]
    ]


def parse_stats(stats):
    """Table columns from one kicker's season statistics."""
    values = {
        (cat["name"], stat["name"]): stat["value"]
        for cat in stats["splits"]["categories"]
        for stat in cat["stats"]
    }
    return {col: int(values[key]) for col, key in COLUMNS.items()}


def scrape(league):
    sport = LEAGUES[league]
    first = get_json(LIST_URL.format(sport=sport, page=1))
    season = first["requestedSeason"]["year"]
    kickers = parse_list(first)
    for page in range(2, first["pagination"]["pages"] + 1):
        kickers += parse_list(get_json(LIST_URL.format(sport=sport, page=page)))

    now = datetime.now(timezone.utc).isoformat()
    rows = []
    for k in kickers:
        stats = get_json(STATS_URL.format(sport=sport, season=season, id=k["espn_id"]))
        rows.append(
            {"league": league, "season": season, **k, **parse_stats(stats), "updated_at": now}
        )
        time.sleep(0.1)  # stay polite
    return rows


def upsert(rows):
    key = os.environ["SUPABASE_SECRET_KEY"]
    req = urllib.request.Request(
        os.environ["SUPABASE_URL"].rstrip("/")
        + "/rest/v1/kickers?on_conflict=league,season,espn_id",
        data=json.dumps(rows).encode(),
        method="POST",
        headers={
            "apikey": key,
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    urllib.request.urlopen(req, timeout=30).close()


def main():
    dry_run = "--dry-run" in sys.argv[1:]
    if not dry_run and not (os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SECRET_KEY")):
        sys.exit("Set SUPABASE_URL and SUPABASE_SECRET_KEY, or pass --dry-run to print rows.")
    rows = []
    for league in LEAGUES:
        found = scrape(league)
        print(f"{league}: {len(found)} kickers", file=sys.stderr)
        rows += found
    if dry_run:
        json.dump(rows, sys.stdout, indent=2)
    else:
        upsert(rows)
        print(f"Upserted {len(rows)} rows into kickers.", file=sys.stderr)


if __name__ == "__main__":
    main()
