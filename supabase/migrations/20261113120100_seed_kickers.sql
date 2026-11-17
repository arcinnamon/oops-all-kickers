-- PLACEHOLDER SEED: small sample set, not the full roster. ESPN was unreachable
-- when this was built. Replace with a full roster via a new append-only migration.
insert into public.kickers (league, espn_id, name, team) values
  ('nfl', '4362081', 'Brandon Aubrey', 'Dallas Cowboys'),
  ('nfl', '3051909', 'Justin Tucker', 'Baltimore Ravens'),
  ('nfl', '3040151', 'Harrison Butker', 'Kansas City Chiefs'),
  ('nfl', '4259545', 'Jake Elliott', 'Philadelphia Eagles'),
  ('nfl', '2576980', 'Younghoe Koo', 'Atlanta Falcons'),
  ('fbs', '4429013', 'Placeholder Kicker A', 'Placeholder University'),
  ('fbs', '4429014', 'Placeholder Kicker B', 'Placeholder University')
on conflict (league, espn_id) do update
  set name = excluded.name, team = excluded.team, updated_at = now();
