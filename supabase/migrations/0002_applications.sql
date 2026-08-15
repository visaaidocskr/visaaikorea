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
