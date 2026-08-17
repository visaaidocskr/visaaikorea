-- ===========================================================================
-- 0011_invitation_documents.sql
--
-- Generated documents for invitation cases.
--
-- Kept as its own table rather than widening `generated_documents`: that
-- table's application_id is NOT NULL with a foreign key to `applications`,
-- and invitations are deliberately a separate flow. Making that column
-- nullable so two unrelated things could share one table would weaken a
-- constraint that currently guarantees every generated document belongs to
-- a real application.
--
-- Files live in the same private `generated-documents` bucket, under the
-- owner's user id — the Storage policies in 0002 key off the first path
-- segment, so invitation documents inherit exactly the same protection.
--
-- Idempotent / safe to re-run.
-- ===========================================================================

create table if not exists public.invitation_documents (
  id             uuid primary key default gen_random_uuid(),
  invitation_id  uuid not null references public.invitations (id) on delete cascade,
  -- Which invited person this belongs to. Null would mean a case-level
  -- document; today every document is per person.
  invitee_id     uuid references public.invitation_invitees (id) on delete cascade,
  document_type  text not null,
  file_format    text check (file_format in ('pdf', 'docx')),
  storage_path   text not null,
  generated_by   text check (generated_by in ('ai', 'admin', 'system')),
  released       boolean not null default false,
  generated_at   timestamptz not null default now()
);

create index if not exists idx_invitation_documents_invitation
  on public.invitation_documents (invitation_id);

-- Regenerating replaces the previous file for that person + document type.
create unique index if not exists uq_invitation_documents_person_type
  on public.invitation_documents (invitation_id, invitee_id, document_type);

alter table public.invitation_documents enable row level security;

-- Clients see their own documents only once released; admins see everything.
drop policy if exists "invitation_documents_select" on public.invitation_documents;
create policy "invitation_documents_select" on public.invitation_documents
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.invitations i
      where i.id = invitation_id and i.user_id = auth.uid() and released = true
    )
  );

-- Only admins (and the service role, which bypasses RLS) write these.
drop policy if exists "invitation_documents_admin_write" on public.invitation_documents;
create policy "invitation_documents_admin_write" on public.invitation_documents
  for all using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
