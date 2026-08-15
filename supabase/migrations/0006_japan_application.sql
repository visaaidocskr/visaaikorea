-- ===========================================================================
-- 0006_japan_application.sql
-- Richer Japan visa application data collection (pre-OCR). ADDITIVE ONLY:
-- new columns + new child tables. No drops or renames, so nothing that exists
-- today breaks. New tables reuse the owner-or-admin RLS from 0002
-- (public.owns_application) and the public.set_updated_at() trigger from 0001.
-- Run AFTER 0002 (and safe to re-run).
-- ===========================================================================

-- 1. Extend applicant_details (1:1 fields the official Japan form needs) ------
alter table public.applicant_details
  add column if not exists other_names                 text,
  add column if not exists former_nationality          text,
  add column if not exists birth_city                  text,
  add column if not exists birth_state                 text,
  add column if not exists passport_type               text,   -- diplomatic|official|ordinary|other
  add column if not exists passport_place_of_issue     text,
  add column if not exists passport_issuing_authority  text,
  add column if not exists home_government_id           text,   -- home-country gov ID (distinct from ARC)
  add column if not exists mobile                      text,
  add column if not exists position_title              text,
  add column if not exists employer_phone              text,
  add column if not exists spouse_or_parent_occupation text;

-- 2. Extend applications (1:1 trip-level fields) ------------------------------
alter table public.applications
  add column if not exists port_of_entry             text,
  add column if not exists flight_booked             boolean,
  add column if not exists accommodation_booked      boolean,
  add column if not exists has_previous_japan_visits boolean,
  add column if not exists host_type                 text,   -- none|inviter|guarantor
  add column if not exists remarks                   text,
  -- The 6 page-2 Yes/No background questions, applicant-answered only. Null
  -- until the applicant answers; NEVER auto-filled.
  add column if not exists background_answers        jsonb;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_host_type_check'
  ) then
    alter table public.applications
      add constraint applications_host_type_check
      check (host_type is null or host_type in ('none', 'inviter', 'guarantor'));
  end if;
end $$;

-- 3. flight_bookings (1:1) ----------------------------------------------------
create table if not exists public.flight_bookings (
  application_id       uuid primary key references public.applications (id) on delete cascade,
  airline              text,
  flight_number        text,
  departure_airport    text,
  arrival_airport      text,
  departure_date       date,
  arrival_date         date,
  return_airline       text,
  return_flight_number text,
  return_date          date,
  updated_at           timestamptz not null default now()
);

-- 4. accommodations (1:many — an applicant may stay in several cities) --------
create table if not exists public.accommodations (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  name            text,
  address         text,
  phone           text,
  check_in        date,
  check_out       date,
  sort_order      int not null default 100,
  created_at      timestamptz not null default now()
);
create index if not exists idx_accommodations_application_id
  on public.accommodations (application_id);

-- 5. previous_japan_visits (1:many) ------------------------------------------
create table if not exists public.previous_japan_visits (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  visited_from    date,
  visited_to      date,
  duration_note   text,
  sort_order      int not null default 100,
  created_at      timestamptz not null default now()
);
create index if not exists idx_previous_japan_visits_application_id
  on public.previous_japan_visits (application_id);

-- 6. japan_hosts (1:1 guarantor/inviter) -------------------------------------
create table if not exists public.japan_hosts (
  application_id      uuid primary key references public.applications (id) on delete cascade,
  role                text,   -- inviter|guarantor
  same_as_guarantor   boolean not null default false,
  name                text,
  address             text,
  phone               text,
  date_of_birth       date,
  sex                 text,
  relationship        text,
  occupation          text,
  nationality         text,
  immigration_status  text,
  updated_at          timestamptz not null default now()
);

-- 7. updated_at triggers for the 1:1 tables ----------------------------------
do $$
declare t text;
begin
  foreach t in array array['flight_bookings', 'japan_hosts'] loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- 8. RLS — owner-or-admin, mirroring applicant_details/companions in 0002 -----
do $$
declare t text;
begin
  foreach t in array array[
    'flight_bookings', 'accommodations', 'previous_japan_visits', 'japan_hosts'
  ] loop
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('drop policy if exists %1$s_all on public.%1$s;', t);
    execute format(
      'create policy %1$s_all on public.%1$s for all
         using (public.owns_application(application_id))
         with check (public.owns_application(application_id));', t);
  end loop;
end $$;
