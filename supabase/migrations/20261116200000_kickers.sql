-- Season kicking totals per kicker, loaded by scripts/scrape_kickers.py.
create table public.kickers (
  league text not null check (league in ('nfl', 'fbs')),
  season integer not null,
  espn_id text not null,
  name text not null,
  team text not null,
  games_played integer not null,
  fg_made integer not null,
  fg_attempts integer not null,
  longest integer not null,
  fg_made_1_19 integer not null,
  fg_made_20_29 integer not null,
  fg_made_30_39 integer not null,
  fg_made_40_49 integer not null,
  fg_made_50_plus integer not null,
  fg_attempts_1_19 integer not null,
  fg_attempts_20_29 integer not null,
  fg_attempts_30_39 integer not null,
  fg_attempts_40_49 integer not null,
  fg_attempts_50_plus integer not null,
  xp_made integer not null,
  xp_attempts integer not null,
  updated_at timestamptz not null default now(),
  primary key (league, season, espn_id)
);

alter table public.kickers enable row level security;

-- Public stats: anyone may read. No write policies, so only the secret key
-- (which bypasses RLS) can insert or update.
create policy "kickers are readable by everyone"
  on public.kickers for select
  to anon, authenticated
  using (true);
