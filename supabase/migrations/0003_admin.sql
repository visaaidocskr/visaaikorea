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
