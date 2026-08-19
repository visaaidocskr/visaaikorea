-- Embassy-specific public holidays and exceptional closures. Operations can
-- add, correct or temporarily disable a date without a code deployment.
-- This is additive and follows the public-rule/admin-write model of 0004.
create table if not exists public.embassy_closures (
  id uuid primary key default gen_random_uuid(),
  destination_country text not null,
  closure_date date not null,
  name text not null,
  source text not null default 'Embassy' check (source in ('Korea', 'Japan', 'Embassy')),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (destination_country, closure_date)
);

create index if not exists idx_embassy_closures_destination_date
  on public.embassy_closures (destination_country, closure_date);

drop trigger if exists trg_embassy_closures_updated_at on public.embassy_closures;
create trigger trg_embassy_closures_updated_at
  before update on public.embassy_closures
  for each row execute function public.set_updated_at();

alter table public.embassy_closures enable row level security;

drop policy if exists embassy_closures_read on public.embassy_closures;
create policy embassy_closures_read on public.embassy_closures
  for select using (true);

drop policy if exists embassy_closures_write on public.embassy_closures;
create policy embassy_closures_write on public.embassy_closures
  for all using (public.is_admin()) with check (public.is_admin());
