-- Active flag for the kicker pool. Default keeps the currently deployed code working.
alter table public.kickers add column active boolean not null default true;
