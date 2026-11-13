-- Kicker roster for the pool table. Public read, no write policies.
create table public.kickers (
  id bigint generated always as identity primary key,
  league text not null check (league in ('nfl', 'fbs')),
  espn_id text not null,
  name text not null,
  team text not null,
  updated_at timestamptz not null default now(),
  unique (league, espn_id)
);

create index kickers_league_team_name_idx on public.kickers (league, team, name);

alter table public.kickers enable row level security;

create policy "kickers are readable by everyone"
  on public.kickers for select
  to anon, authenticated
  using (true);
