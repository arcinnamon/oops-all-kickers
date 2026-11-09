-- Returns the database clock. Reads no data, so no RLS applies.
create or replace function public.db_now()
returns timestamptz
language sql
stable
security invoker
as $$
  select now();
$$;

revoke execute on function public.db_now() from public;
grant execute on function public.db_now() to anon, authenticated;
