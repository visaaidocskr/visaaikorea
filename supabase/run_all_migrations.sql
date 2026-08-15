-- =============================================================
-- VisaAI Korea — ALL migrations (0001 + 0002 + 0003 + 0004), in order.
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Creates: tables, RLS, triggers, and the 4 private Storage buckets.
-- Idempotent: safe to re-run.
-- =============================================================


-- ========== 0001_init_profiles.sql ==========
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


-- ========== 0002_applications.sql ==========
-- ===========================================================================
-- VisaAI Korea — Phase 2: Applications, applicant details, companions,
-- uploaded files + RLS + private Storage buckets and policies.
-- Run AFTER 0001_init_profiles.sql. Idempotent / safe to re-run.
-- ===========================================================================

-- 1. Enums -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type public.application_status as enum (
      'draft',
      'submitted',
      'reviewing',
      'missing_documents',
      'documents_generating',
      'waiting_manual_reservations',
      'completed',
      'rejected',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'japan_processing_type') then
    create type public.japan_processing_type as enum ('sticker', 'evisa');
  end if;
end$$;

-- 2. applications ----------------------------------------------------------
create table if not exists public.applications (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles (id) on delete cascade,
  destination_country      text,
  destination_city         text,
  nationality              text,
  korean_visa_status       text,
  travel_purpose           text,
  planned_submission_date  date,
  travel_start_date        date,
  travel_end_date          date,
  stay_days                integer,
  current_korea_address    text,
  city_region_detected     text,
  japan_processing_type    public.japan_processing_type,
  status                   public.application_status not null default 'draft',
  client_email             text,
  client_phone             text,
  consent_confirmed        boolean not null default false,
  consent_confirmed_at     timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_applications_user_id on public.applications (user_id);
create index if not exists idx_applications_status on public.applications (status);

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- 3. applicant_details (one-to-one with application) -----------------------
create table if not exists public.applicant_details (
  application_id              uuid primary key references public.applications (id) on delete cascade,
  surname                     text,
  given_name                  text,
  middle_name_or_patronymic   text,
  full_name_as_passport       text,
  date_of_birth               date,
  gender                      text,
  passport_number             text,
  passport_issue_date         date,
  passport_expiry_date        date,
  country_of_birth            text,
  nationality                 text,
  marital_status              text,
  occupation                  text,
  employer_or_school_name     text,
  employer_or_school_address  text,
  korea_arrival_date          date,
  korean_arc_number           text,
  korean_arc_expiry_date      date,
  updated_at                  timestamptz not null default now()
);

drop trigger if exists trg_applicant_details_updated_at on public.applicant_details;
create trigger trg_applicant_details_updated_at
  before update on public.applicant_details
  for each row execute function public.set_updated_at();

-- 4. companions ------------------------------------------------------------
create table if not exists public.companions (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.applications (id) on delete cascade,
  full_name         text not null,
  nationality       text,
  relationship      text,
  passport_number   text,
  is_family_member  boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_companions_application_id on public.companions (application_id);

-- 5. uploaded_files --------------------------------------------------------
create table if not exists public.uploaded_files (
  id                uuid primary key default gen_random_uuid(),
  application_id    uuid not null references public.applications (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  file_type         text not null,
  original_filename text,
  storage_path      text not null,
  mime_type         text,
  size              bigint,
  required          boolean not null default true,
  uploaded_at       timestamptz not null default now()
);

create index if not exists idx_uploaded_files_application_id on public.uploaded_files (application_id);

-- One stored file per (application, document type): re-uploading replaces it.
create unique index if not exists uq_uploaded_files_app_type
  on public.uploaded_files (application_id, file_type);

-- ===========================================================================
-- 6. Row Level Security
--    Helper: an application is "mine" if I own it, or I'm an admin.
-- ===========================================================================
create or replace function public.owns_application(app_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.applications a
    where a.id = app_id and (a.user_id = auth.uid() or public.is_admin())
  );
$$;

-- applications
alter table public.applications enable row level security;

drop policy if exists applications_select on public.applications;
create policy applications_select on public.applications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists applications_insert on public.applications;
create policy applications_insert on public.applications
  for insert with check (user_id = auth.uid());

drop policy if exists applications_update_owner on public.applications;
create policy applications_update_owner on public.applications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists applications_update_admin on public.applications;
create policy applications_update_admin on public.applications
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists applications_delete_owner on public.applications;
create policy applications_delete_owner on public.applications
  for delete using (user_id = auth.uid() and status = 'draft');

-- applicant_details
alter table public.applicant_details enable row level security;

drop policy if exists applicant_details_all on public.applicant_details;
create policy applicant_details_all on public.applicant_details
  for all
  using (public.owns_application(application_id))
  with check (public.owns_application(application_id));

-- companions
alter table public.companions enable row level security;

drop policy if exists companions_all on public.companions;
create policy companions_all on public.companions
  for all
  using (public.owns_application(application_id))
  with check (public.owns_application(application_id));

-- uploaded_files
alter table public.uploaded_files enable row level security;

drop policy if exists uploaded_files_select on public.uploaded_files;
create policy uploaded_files_select on public.uploaded_files
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists uploaded_files_insert on public.uploaded_files;
create policy uploaded_files_insert on public.uploaded_files
  for insert with check (user_id = auth.uid() and public.owns_application(application_id));

drop policy if exists uploaded_files_delete on public.uploaded_files;
create policy uploaded_files_delete on public.uploaded_files
  for delete using (user_id = auth.uid() or public.is_admin());

-- Owner UPDATE policy: required because registerUploadedFile() upserts on
-- (application_id, file_type); re-uploads ("Replace file") perform an UPDATE.
drop policy if exists uploaded_files_update on public.uploaded_files;
create policy uploaded_files_update on public.uploaded_files
  for update
  using (user_id = auth.uid() and public.owns_application(application_id))
  with check (user_id = auth.uid() and public.owns_application(application_id));

-- ===========================================================================
-- 7. Private Storage buckets
-- ===========================================================================
insert into storage.buckets (id, name, public)
values
  ('applicant-uploads',   'applicant-uploads',   false),
  ('generated-documents', 'generated-documents', false),
  ('document-templates',  'document-templates',  false),
  ('admin-reservations',  'admin-reservations',  false)
on conflict (id) do nothing;

-- 8. Storage policies ------------------------------------------------------
-- Convention: object name (path) = "{user_id}/{application_id}/{file}".
-- storage.foldername(name)[1] is the first path segment = owner's user id.

-- applicant-uploads: a client manages only their own folder; admins read all.
drop policy if exists applicant_uploads_insert on storage.objects;
create policy applicant_uploads_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'applicant-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists applicant_uploads_select on storage.objects;
create policy applicant_uploads_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'applicant-uploads'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists applicant_uploads_update on storage.objects;
create policy applicant_uploads_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'applicant-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists applicant_uploads_delete on storage.objects;
create policy applicant_uploads_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'applicant-uploads'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- generated-documents: clients read only their own; writes are server-side
-- (service role bypasses RLS), so no client insert policy here.
drop policy if exists generated_documents_select on storage.objects;
create policy generated_documents_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'generated-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- document-templates & admin-reservations: admin-only via RLS.
-- (Server/service-role code bypasses RLS for system operations.)
drop policy if exists templates_admin_all on storage.objects;
create policy templates_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'document-templates' and public.is_admin())
  with check (bucket_id = 'document-templates' and public.is_admin());

drop policy if exists admin_reservations_all on storage.objects;
create policy admin_reservations_all on storage.objects
  for all to authenticated
  using (bucket_id = 'admin-reservations' and public.is_admin())
  with check (bucket_id = 'admin-reservations' and public.is_admin());


-- ========== 0003_admin.sql ==========
-- ===========================================================================
-- VisaAI Korea — Phase 4: Admin support tables
--   admin_notes, audit_logs, generated_documents, email_logs,
--   document_templates, destination_rules, visa_status_rules
-- Run AFTER 0002_applications.sql. Idempotent / safe to re-run.
-- ===========================================================================

-- 1. admin_notes -----------------------------------------------------------
create table if not exists public.admin_notes (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  admin_id        uuid references public.profiles (id) on delete set null,
  note            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_admin_notes_application_id on public.admin_notes (application_id);

-- 2. audit_logs ------------------------------------------------------------
create table if not exists public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  actor_id       uuid references public.profiles (id) on delete set null,
  action         text not null,
  entity_type    text,
  entity_id      uuid,
  metadata_json  jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);

-- 3. generated_documents ---------------------------------------------------
create table if not exists public.generated_documents (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  document_type   text not null,
  file_format     text check (file_format in ('pdf', 'docx')),
  storage_path    text not null,
  generated_by    text check (generated_by in ('ai', 'admin', 'system')),
  released        boolean not null default false,
  generated_at    timestamptz not null default now()
);
create index if not exists idx_generated_documents_application_id on public.generated_documents (application_id);

-- One row per (application, document type): regeneration replaces it.
create unique index if not exists uq_generated_documents_app_type
  on public.generated_documents (application_id, document_type);

-- 4. email_logs ------------------------------------------------------------
create table if not exists public.email_logs (
  id                   uuid primary key default gen_random_uuid(),
  application_id       uuid references public.applications (id) on delete set null,
  to_email             text not null,
  subject              text,
  status               text,
  provider_message_id  text,
  sent_at              timestamptz not null default now()
);
create index if not exists idx_email_logs_application_id on public.email_logs (application_id);

-- 5. document_templates ----------------------------------------------------
create table if not exists public.document_templates (
  id                   uuid primary key default gen_random_uuid(),
  destination_country  text,
  processing_type      text,
  template_type        text,
  template_name        text not null,
  storage_path         text not null,
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists trg_document_templates_updated_at on public.document_templates;
create trigger trg_document_templates_updated_at
  before update on public.document_templates
  for each row execute function public.set_updated_at();

-- 6. destination_rules (admin-editable overrides; code is the default) -----
create table if not exists public.destination_rules (
  id                   uuid primary key default gen_random_uuid(),
  destination_country  text not null,
  rule_key             text not null,
  rule_json            jsonb,
  active               boolean not null default true,
  updated_at           timestamptz not null default now(),
  unique (destination_country, rule_key)
);

drop trigger if exists trg_destination_rules_updated_at on public.destination_rules;
create trigger trg_destination_rules_updated_at
  before update on public.destination_rules
  for each row execute function public.set_updated_at();

-- 7. visa_status_rules -----------------------------------------------------
create table if not exists public.visa_status_rules (
  id                       uuid primary key default gen_random_uuid(),
  korean_visa_status       text not null unique,
  required_documents_json  jsonb,
  optional_documents_json  jsonb,
  active                   boolean not null default true
);

-- ===========================================================================
-- RLS
-- ===========================================================================

-- admin_notes: admin-only.
alter table public.admin_notes enable row level security;
drop policy if exists admin_notes_all on public.admin_notes;
create policy admin_notes_all on public.admin_notes
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_logs: admins read + insert. (No update/delete.)
alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select using (public.is_admin());
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert with check (public.is_admin());

-- generated_documents: admins manage all; clients read their OWN once released.
alter table public.generated_documents enable row level security;
drop policy if exists generated_documents_select on public.generated_documents;
create policy generated_documents_select on public.generated_documents
  for select using (
    public.is_admin()
    or (released = true and public.owns_application(application_id))
  );
drop policy if exists generated_documents_write on public.generated_documents;
create policy generated_documents_write on public.generated_documents
  for all using (public.is_admin()) with check (public.is_admin());

-- email_logs: admin-only.
alter table public.email_logs enable row level security;
drop policy if exists email_logs_all on public.email_logs;
create policy email_logs_all on public.email_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- document_templates: admin-only.
alter table public.document_templates enable row level security;
drop policy if exists document_templates_all on public.document_templates;
create policy document_templates_all on public.document_templates
  for all using (public.is_admin()) with check (public.is_admin());

-- destination_rules / visa_status_rules: any authenticated user may READ
-- (the form needs them); only admins may WRITE.
alter table public.destination_rules enable row level security;
drop policy if exists destination_rules_select on public.destination_rules;
create policy destination_rules_select on public.destination_rules
  for select to authenticated using (true);
drop policy if exists destination_rules_write on public.destination_rules;
create policy destination_rules_write on public.destination_rules
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.visa_status_rules enable row level security;
drop policy if exists visa_status_rules_select on public.visa_status_rules;
create policy visa_status_rules_select on public.visa_status_rules
  for select to authenticated using (true);
drop policy if exists visa_status_rules_write on public.visa_status_rules;
create policy visa_status_rules_write on public.visa_status_rules
  for all using (public.is_admin()) with check (public.is_admin());

-- ===========================================================================
-- Storage: let admins WRITE into generated-documents (system docs are written
-- server-side via service-role, but admins also upload reservations directly
-- from the browser into a client's {user_id}/ folder). Clients still only READ
-- their own folder (policy from 0002).
-- ===========================================================================
drop policy if exists generated_documents_admin_write on storage.objects;
create policy generated_documents_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'generated-documents' and public.is_admin())
  with check (bucket_id = 'generated-documents' and public.is_admin());

-- Allow admins to read every profile already covered by profiles_select
-- (is_admin()) from migration 0001 — no change needed here.
