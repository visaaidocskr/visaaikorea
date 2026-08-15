-- ===========================================================================
-- 0004_visa_engine.sql
-- Data-driven visa engine (P0). Typed tables that mirror the TypeScript rule
-- defaults in lib/visa/*. The application READS THROUGH these tables but always
-- falls back to the code defaults, so:
--   * the app behaves identically whether or not this migration is applied;
--   * an empty table is indistinguishable from "use the code default";
--   * once seeded (scripts/seed-visa-rules.ts), rows OVERRIDE the code and add
--     new countries/nationalities without a redeploy.
--
-- All tables are PUBLIC reference data (visa rules are not secret) — readable by
-- everyone so the public /apply and landing pages work unauthenticated; only
-- admins may write. Pre-existing destination_rules / visa_status_rules (0003)
-- are left untouched.
-- ===========================================================================

-- --- Shared enums ----------------------------------------------------------
-- "official" rules come from an embassy/government source; "agency" items are
-- our recommendations. "uncertain" flags data that still needs verification.
do $$ begin
  create type public.rule_source as enum ('official', 'agency');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.visa_certainty as enum ('confirmed', 'uncertain');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.visa_outcome as enum ('visa_free', 'evisa', 'visa_required');
exception when duplicate_object then null; end $$;

-- --- 1. destinations -------------------------------------------------------
create table if not exists public.destinations (
  id            uuid primary key default gen_random_uuid(),
  country       text not null unique,
  flag          text,
  visa_type     text,
  cities        text[] not null default '{}',
  accent        text,
  sort_order    int  not null default 100,
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- --- 2. nationalities ------------------------------------------------------
create table if not exists public.nationalities (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  demonym          text,
  patronymic_rule  text not null default 'optional',  -- required | optional | hidden
  sort_order       int  not null default 100,
  active           boolean not null default true,
  updated_at       timestamptz not null default now()
);

-- --- 3. korean_visa_types --------------------------------------------------
create table if not exists public.korean_visa_types (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,   -- e.g. "D-2"
  label       text not null,          -- e.g. "D-2 Student"
  sort_order  int  not null default 100,
  active      boolean not null default true
);

-- --- 4. embassies ----------------------------------------------------------
create table if not exists public.embassies (
  id                   uuid primary key default gen_random_uuid(),
  destination_country  text not null,
  office               text not null,
  address              text,
  phone                text,
  email                text,
  sort_order           int  not null default 100,
  updated_at           timestamptz not null default now()
);
create index if not exists idx_embassies_dest on public.embassies (destination_country);

-- --- 5. eligibility_rules (nationality x destination) ----------------------
-- nationality NULL = the destination default rule.
create table if not exists public.eligibility_rules (
  id                   uuid primary key default gen_random_uuid(),
  destination_country  text not null,
  nationality          text,                       -- null = default
  outcome              public.visa_outcome not null,
  max_stay_days        int,
  note                 text,
  entry_conditions     text[],                      -- null = generate default copy
  travel_guidance      text[],                      -- null = generate default copy
  source               public.rule_source not null default 'official',
  certainty            public.visa_certainty not null default 'confirmed',
  updated_at           timestamptz not null default now(),
  unique (destination_country, nationality)
);
create index if not exists idx_eligibility_dest on public.eligibility_rules (destination_country);

-- --- 6. destination_date_rules ---------------------------------------------
create table if not exists public.destination_date_rules (
  id                    uuid primary key default gen_random_uuid(),
  destination_country   text not null unique,
  anchor_label          text not null,
  anchor_required       boolean not null default true,
  lead_min_days         int  not null,
  lead_max_days         int,
  lead_max_months       int,
  min_stay_days         int  not null,
  max_stay_days         int  not null,
  recommended_stay_min  int  not null,
  recommended_stay_max  int  not null,
  max_stay_error        text not null,
  lead_too_soon_error   text not null,
  bank_recommendation_krw int,
  guidance              text,
  processing_text       text,
  requires_appointment  boolean not null default false,
  appointment_info      jsonb,
  source                public.rule_source not null default 'official',
  certainty             public.visa_certainty not null default 'confirmed',
  updated_at            timestamptz not null default now()
);

-- --- 7. required_documents (destination x korean visa status) --------------
-- destination_country NULL = applies to any destination.
-- korean_visa_code   NULL = applies to any Korean visa status.
-- This finally expresses the destination x visa-status document matrix.
create table if not exists public.required_documents (
  id                    uuid primary key default gen_random_uuid(),
  destination_country   text,                       -- null = any
  korean_visa_code      text,                       -- null = any
  doc_key               text not null,
  label_en              text not null,
  label_ko              text,
  required              boolean not null default true,
  hint                  text,
  category              text,                        -- e.g. "base" | "status" | "destination"
  sort_order            int  not null default 100,
  source                public.rule_source not null default 'official',
  certainty             public.visa_certainty not null default 'confirmed',
  active                boolean not null default true,
  updated_at            timestamptz not null default now(),
  unique (destination_country, korean_visa_code, doc_key)
);
create index if not exists idx_reqdocs_dest on public.required_documents (destination_country);
create index if not exists idx_reqdocs_code on public.required_documents (korean_visa_code);

-- --- 8. country_guidance (the consultant-grade modal copy) ------------------
create table if not exists public.country_guidance (
  id                     uuid primary key default gen_random_uuid(),
  destination_country    text not null unique,
  visa_validity          text,
  max_stay               text,
  processing_time        text,
  why_recommended_dates  text,
  risks_too_close        text,
  recommended_duration   text,
  important_notes        text[] not null default '{}',
  source                 public.rule_source not null default 'official',
  certainty              public.visa_certainty not null default 'confirmed',
  updated_at             timestamptz not null default now()
);

-- --- 9. financial_requirements (empty scaffold; filled in P1) ---------------
create table if not exists public.financial_requirements (
  id                   uuid primary key default gen_random_uuid(),
  destination_country  text not null,
  nationality          text,                        -- null = all
  min_balance_krw      int,
  statement_months     int,
  notes                text,
  source               public.rule_source not null default 'agency',
  certainty            public.visa_certainty not null default 'confirmed',
  updated_at           timestamptz not null default now(),
  unique (destination_country, nationality)
);

-- --- 10. faqs (empty scaffold; filled in P2) -------------------------------
create table if not exists public.faqs (
  id                   uuid primary key default gen_random_uuid(),
  destination_country  text,                        -- null = global
  question             text not null,
  answer               text not null,
  sort_order           int  not null default 100,
  active               boolean not null default true,
  updated_at           timestamptz not null default now()
);

-- --- 11. latest_updates (empty scaffold; filled in P2) ---------------------
create table if not exists public.latest_updates (
  id                   uuid primary key default gen_random_uuid(),
  destination_country  text,                        -- null = global
  title                text not null,
  body                 text,
  source_url           text,
  published_at         timestamptz not null default now(),
  active               boolean not null default true
);

-- --- updated_at triggers (reuse public.set_updated_at from 0001) -----------
do $$
declare t text;
begin
  foreach t in array array[
    'destinations','nationalities','embassies','eligibility_rules',
    'destination_date_rules','required_documents','country_guidance',
    'financial_requirements','faqs'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ===========================================================================
-- RLS — public reference data: everyone may READ, only admins may WRITE.
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'destinations','nationalities','korean_visa_types','embassies',
    'eligibility_rules','destination_date_rules','required_documents',
    'country_guidance','financial_requirements','faqs','latest_updates'
  ] loop
    execute format('alter table public.%1$s enable row level security;', t);
    execute format('drop policy if exists %1$s_read on public.%1$s;', t);
    execute format(
      'create policy %1$s_read on public.%1$s for select using (true);', t);
    execute format('drop policy if exists %1$s_write on public.%1$s;', t);
    execute format(
      'create policy %1$s_write on public.%1$s
         for all using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;
