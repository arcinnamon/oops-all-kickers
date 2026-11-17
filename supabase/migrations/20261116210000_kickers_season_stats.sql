-- Season kicking totals per kicker, loaded by scripts/scrape_kickers.py.
-- The roster table becomes one row per kicker per season.
alter table public.kickers add column season integer;
update public.kickers set season = 2026 where season is null;
alter table public.kickers alter column season set not null;

-- Null until the scraper has loaded a kicker's stats.
alter table public.kickers
  add column games_played integer,
  add column fg_made integer,
  add column fg_attempts integer,
  add column longest integer,
  add column fg_made_1_19 integer,
  add column fg_made_20_29 integer,
  add column fg_made_30_39 integer,
  add column fg_made_40_49 integer,
  add column fg_made_50_plus integer,
  add column fg_attempts_1_19 integer,
  add column fg_attempts_20_29 integer,
  add column fg_attempts_30_39 integer,
  add column fg_attempts_40_49 integer,
  add column fg_attempts_50_plus integer,
  add column xp_made integer,
  add column xp_attempts integer;

-- The scraper upserts on (league, season, espn_id).
alter table public.kickers
  add constraint kickers_league_season_espn_id_key unique (league, season, espn_id),
  drop constraint kickers_league_espn_id_key;
