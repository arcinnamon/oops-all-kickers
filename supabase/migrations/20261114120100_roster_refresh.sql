-- ROSTER REFRESH: ESPN was unreachable when this was built, so only the kickers
-- already seeded are re-asserted as active. Replace with a full roster via a new
-- append-only migration. Rows are never deleted.
insert into public.kickers (league, espn_id, name, team, active) values
  ('nfl', '4362081', 'Brandon Aubrey', 'Dallas Cowboys', true),
  ('nfl', '3051909', 'Justin Tucker', 'Baltimore Ravens', true),
  ('nfl', '3040151', 'Harrison Butker', 'Kansas City Chiefs', true),
  ('nfl', '4259545', 'Jake Elliott', 'Philadelphia Eagles', true),
  ('nfl', '2576980', 'Younghoe Koo', 'Atlanta Falcons', true)
on conflict (league, espn_id) do update
  set name = excluded.name, team = excluded.team, active = excluded.active, updated_at = now();

-- Placeholder FBS rows are not real kickers.
update public.kickers
  set active = false, updated_at = now()
  where league = 'fbs' and espn_id in ('4429013', '4429014');
