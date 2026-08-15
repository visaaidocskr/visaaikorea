-- ===========================================================================
-- VisaAI Korea — Phase 1: Profiles, roles, RLS
-- Run this in the Supabase SQL Editor (or via the Supabase CLI).
-- Safe to re-run: guarded with IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ===========================================================================

-- 1. Role enum -------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('client', 'admin');
  end if;
end$$;

-- 2. Profiles table --------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Per-user profile. Mirrors auth.users; role gates client vs admin access.';

-- 3. updated_at trigger ----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. Auto-create a profile row whenever a new auth user signs up -----------
--    Runs as SECURITY DEFINER so it can insert despite RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. is_admin() helper -----------------------------------------------------
--    SECURITY DEFINER avoids infinite RLS recursion when policies on other
--    tables need to ask "is the current user an admin?".
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 6. Row Level Security ----------------------------------------------------
alter table public.profiles enable row level security;

-- Clients can read their own profile; admins can read all.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

-- Users can update their own profile, but CANNOT change their own role.
-- (Role escalation is blocked: the new row's role must equal the old row's role.)
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- Admins can update any profile (including roles).
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- No client-side INSERT policy: profile rows are created only by the
-- handle_new_user() trigger. No DELETE policy: profiles cascade from auth.users.

-- ===========================================================================
-- To promote yourself to admin AFTER signing up, run (replace the email):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ===========================================================================
